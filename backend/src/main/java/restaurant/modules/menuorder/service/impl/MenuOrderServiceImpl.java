package restaurant.modules.menuorder.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import restaurant.common.exception.BusinessConflictException;
import restaurant.common.exception.ErrorCode;
import restaurant.common.exception.ResourceNotFoundException;
import restaurant.common.response.PageResponse;
import restaurant.modules.inventory.entity.NguyenLieu;
import restaurant.modules.inventory.repository.NguyenLieuRepository;
import restaurant.modules.menuorder.dto.*;
import restaurant.modules.menuorder.entity.DatMon;
import restaurant.modules.menuorder.entity.ThucDon;
import restaurant.modules.menuorder.entity.id.DatMonId;
import restaurant.modules.menuorder.enums.TrangThaiDatMon;
import restaurant.modules.menuorder.mapper.MenuOrderMapper;
import restaurant.modules.menuorder.repository.DatMonRepository;
import restaurant.modules.menuorder.repository.ThucDonRepository;
import restaurant.modules.menuorder.service.MenuOrderService;
import restaurant.modules.reservation.entity.KhachHang;
import restaurant.modules.reservation.repository.KhachHangRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Lớp triển khai toàn bộ nghiệp vụ của phân hệ Thực đơn & Gọi món.
 * Kết nối với {@code ThucDonRepository}, {@code DatMonRepository}, {@code KhachHangRepository},
 * {@code NguyenLieuRepository} và {@code MenuOrderMapper} để quản lý danh mục món ăn,
 * kiểm tra điều kiện nguyên liệu khi khách gọi món và điều phối vòng đời trạng thái chế biến.
 */
@Service
@RequiredArgsConstructor
public class MenuOrderServiceImpl implements MenuOrderService {

    private final ThucDonRepository thucDonRepository;
    private final DatMonRepository datMonRepository;
    private final KhachHangRepository khachHangRepository;
    private final NguyenLieuRepository nguyenLieuRepository;
    private final MenuOrderMapper menuOrderMapper;

    /**
     * Thêm mới món ăn vào bảng {@code thucdon} và ánh xạ danh sách nguyên liệu cấu thành
     * vào bảng trung gian {@code nguyenlieumonan}; xác minh mã món chưa tồn tại và toàn bộ
     * mã nguyên liệu truyền vào đều hợp lệ trong kho.
     */
    @Override
    @Transactional
    public ThucDonDTO createMenuItem(ThucDonDTO dto) {
        if (thucDonRepository.existsById(dto.getMaMon())) {
            throw new BusinessConflictException("Mã món ăn '" + dto.getMaMon() + "' đã tồn tại");
        }

        Set<NguyenLieu> ingredients = resolveIngredients(dto.getMaNguyenLieuList());
        ThucDon saved = thucDonRepository.save(menuOrderMapper.toEntity(dto, ingredients));
        return menuOrderMapper.toDTO(saved);
    }

    /**
     * Cập nhật thông tin món ăn (tên món, mô tả, đơn giá) và đồng bộ lại tập nguyên liệu cấu thành
     * trong bảng {@code nguyenlieumonan} nếu có danh sách mã nguyên liệu mới.
     */
    @Override
    @Transactional
    public ThucDonDTO updateMenuItem(String maMon, ThucDonDTO dto) {
        ThucDon existing = thucDonRepository.findById(maMon)
                .orElseThrow(() -> new ResourceNotFoundException("ThucDon", "maMon", maMon));

        existing.setTenMon(dto.getTenMon());
        existing.setMoTa(dto.getMoTa());
        existing.setGiaBan(dto.getGiaBan());
        if (dto.getMaNguyenLieuList() != null) {
            existing.setDanhSachNguyenLieu(resolveIngredients(dto.getMaNguyenLieuList()));
        }

        return menuOrderMapper.toDTO(thucDonRepository.save(existing));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ThucDonDTO> getAllMenuItems(Pageable pageable) {
        Page<ThucDonDTO> page = thucDonRepository.findAll(pageable).map(menuOrderMapper::toDTO);
        return PageResponse.fromPage(page);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ThucDonDTO> searchMenuItemsByName(String keyword) {
        return thucDonRepository.findByTenMonContainingIgnoreCase(keyword).stream()
                .map(menuOrderMapper::toDTO)
                .toList();
    }

    /**
     * Ghi nhận lượt gọi món mới của khách hàng: thực hiện khấu trừ tồn kho nguyên tử dưới MySQL
     * theo số lượng phần ăn khách đặt (rollback ngay nếu bất kỳ nguyên liệu nào không đủ tồn hoặc hết hạn),
     * đồng thời xử lý chống trùng mốc thời gian {@code ThoiGianGoi} trong khóa phức hợp {@code DatMonId}.
     */
    @Override
    @Transactional
    public DatMonResponseDTO placeDishOrder(DatMonRequestDTO dto) {
        KhachHang khachHang = khachHangRepository.findById(dto.getMaKH())
                .orElseThrow(() -> new ResourceNotFoundException("KhachHang", "maKH", dto.getMaKH()));
        ThucDon thucDon = thucDonRepository.findById(dto.getMaMon())
                .orElseThrow(() -> new ResourceNotFoundException("ThucDon", "maMon", dto.getMaMon()));

        BigDecimal requiredQuantity = BigDecimal.valueOf(dto.getSoLuong());
        LocalDate today = LocalDate.now();

        for (NguyenLieu ingredient : thucDon.getDanhSachNguyenLieu()) {
            int updatedRows = nguyenLieuRepository.deductStockAtomically(
                    ingredient.getMaNguyenLieu(),
                    requiredQuantity,
                    today
            );
            if (updatedRows == 0) {
                throw new BusinessConflictException(
                        ErrorCode.INSUFFICIENT_INGREDIENT_STOCK,
                        "Nguyên liệu '" + ingredient.getTenNguyenLieu() + "' không đủ lượng tồn hoặc đã quá hạn sử dụng"
                );
            }
        }

        LocalDateTime orderTime = LocalDateTime.now().truncatedTo( java.time.temporal.ChronoUnit.SECONDS );
        DatMonId orderId = new DatMonId(khachHang.getMaKH(), thucDon.getMaMon(), orderTime);
        while (datMonRepository.existsById(orderId)) {
            orderTime = orderTime.plusSeconds(1);
            orderId = new DatMonId(khachHang.getMaKH(), thucDon.getMaMon(), orderTime);
        }

        DatMon datMon = DatMon.builder()
                .id(orderId)
                .khachHang(khachHang)
                .thucDon(thucDon)
                .soLuong(dto.getSoLuong())
                .trangThai(TrangThaiDatMon.CHO_CHE_BIEN)
                .ghiChu(dto.getGhiChu())
                .build();

        DatMon saved = datMonRepository.save(datMon);
        return menuOrderMapper.toDatMonResponseDTO(saved);
    }

    /**
     * Cập nhật trạng thái món ăn; nếu chuyển từ {@code CHO_CHE_BIEN} sang {@code DA_HUY}
     * thì tự động hoàn trả lại lượng nguyên liệu đã khấu trừ vào kho.
     */
    @Override
    @Transactional
    public DatMonResponseDTO updateDishOrderStatus(
            String maKH,
            String maMon,
            LocalDateTime thoiGianGoi,
            TrangThaiDatMon newStatus) {
        DatMonId orderId = new DatMonId(maKH, maMon, thoiGianGoi);
        DatMon datMon = datMonRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("Không tìm thấy lượt gọi món (MaKH=%s, MaMon=%s, ThoiGianGoi=%s)",
                                maKH, maMon, thoiGianGoi)
                ));

        TrangThaiDatMon currentStatus = datMon.getTrangThai();
        if (currentStatus == TrangThaiDatMon.DA_PHUC_VU || currentStatus == TrangThaiDatMon.DA_HUY) {
            throw new BusinessConflictException(
                    ErrorCode.INVALID_ORDER_STATUS,
                    "Không thể thay đổi trạng thái của món ăn đã phục vụ hoặc đã hủy"
            );
        }
        if (currentStatus == TrangThaiDatMon.DANG_CHE_BIEN && newStatus == TrangThaiDatMon.DA_HUY) {
            throw new BusinessConflictException(
                    ErrorCode.INVALID_ORDER_STATUS,
                    "Món ăn đang được bếp chế biến, không thể hủy"
            );
        }

        if (newStatus == TrangThaiDatMon.DA_HUY) {
            BigDecimal restoredQty = BigDecimal.valueOf(datMon.getSoLuong());
            for (NguyenLieu ingredient : datMon.getThucDon().getDanhSachNguyenLieu()) {
                nguyenLieuRepository.restoreStockAtomically(ingredient.getMaNguyenLieu(), restoredQty);
            }
        }

        datMon.setTrangThai(newStatus);
        return menuOrderMapper.toDatMonResponseDTO(datMonRepository.save(datMon));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DishStatusStatProjection> getDishStatusStatsByDate(LocalDate date) {
        return datMonRepository.countDishStatusByDate(date);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerDishOrderProjection> getCustomerOrdersByPhoneAndDate(String sdt, LocalDate date) {
        return datMonRepository.findCustomerOrdersByPhoneAndDate(sdt, date);
    }

    private Set<NguyenLieu> resolveIngredients(Set<String> ingredientIds) {
        if (ingredientIds == null || ingredientIds.isEmpty()) {
            return new HashSet<>();
        }
        List<NguyenLieu> foundIngredients = nguyenLieuRepository.findAllById(ingredientIds);
        if (foundIngredients.size() != ingredientIds.size()) {
            throw new ResourceNotFoundException("Một hoặc nhiều mã nguyên liệu không tồn tại trong kho");
        }
        return new HashSet<>(foundIngredients);
    }

    private void validateDishIngredientsAvailability(ThucDon thucDon) {
        for (NguyenLieu ingredient : thucDon.getDanhSachNguyenLieu()) {
            if (ingredient.getLuongTon().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessConflictException(
                        ErrorCode.INSUFFICIENT_INGREDIENT_STOCK,
                        "Món '" + thucDon.getTenMon() + "' tạm hết nguyên liệu: " + ingredient.getTenNguyenLieu()
                );
            }
            if (ingredient.getHanSuDung() != null && ingredient.getHanSuDung().isBefore(LocalDate.now())) {
                throw new BusinessConflictException(
                        ErrorCode.INGREDIENT_EXPIRED,
                        "Nguyên liệu '" + ingredient.getTenNguyenLieu() + "' của món đã quá hạn sử dụng"
                );
            }
        }
    }

}
