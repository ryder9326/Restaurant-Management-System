package restaurant.modules.inventory.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import restaurant.common.exception.BusinessConflictException;
import restaurant.common.exception.ErrorCode;
import restaurant.common.exception.ResourceNotFoundException;
import restaurant.common.response.PageResponse;
import restaurant.modules.hr.entity.NhanVien;
import restaurant.modules.hr.enums.TrangThaiLamViec;
import restaurant.modules.hr.repository.NhanVienRepository;
import restaurant.modules.inventory.dto.CoSoVatChatDTO;
import restaurant.modules.inventory.dto.NguyenLieuDTO;
import restaurant.modules.inventory.entity.CoSoVatChat;
import restaurant.modules.inventory.entity.NguyenLieu;
import restaurant.modules.inventory.mapper.InventoryMapper;
import restaurant.modules.inventory.repository.CoSoVatChatRepository;
import restaurant.modules.inventory.repository.NguyenLieuRepository;
import restaurant.modules.inventory.service.InventoryService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Lớp triển khai nghiệp vụ quản lý cơ sở vật chất và nguyên liệu tồn kho của nhà hàng.
 * Kết nối với {@code CoSoVatChatRepository}, {@code NguyenLieuRepository}, {@code NhanVienRepository}
 * và {@code InventoryMapper} để kiểm soát tài sản, nhập xuất kho, hạn sử dụng và nguồn cung ứng.
 */
@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final CoSoVatChatRepository csvcRepository;
    private final NguyenLieuRepository nguyenLieuRepository;
    private final NhanVienRepository nhanVienRepository;
    private final InventoryMapper inventoryMapper;

    /**
     * Thêm mới tài sản cố định vào bảng {@code cosovatchat} và lưu danh sách nhà cung cấp vào
     * {@code cungcapcsvc}; xác minh mã tài sản chưa tồn tại và nhân viên phụ trách đang làm việc.
     */
    @Override
    @Transactional
    public CoSoVatChatDTO createFacility(CoSoVatChatDTO dto) {
        if (csvcRepository.existsById(dto.getMaTaiSan())) {
            throw new BusinessConflictException("Mã tài sản '" + dto.getMaTaiSan() + "' đã tồn tại");
        }

        NhanVien manager = resolveActiveManager(dto.getMaNVQuanLy());
        CoSoVatChat saved = csvcRepository.save(inventoryMapper.toEntity(dto, manager));
        return inventoryMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public CoSoVatChatDTO updateFacilityStatus(String maTaiSan, String tinhTrang) {
        CoSoVatChat facility = csvcRepository.findById(maTaiSan)
                .orElseThrow(() -> new ResourceNotFoundException("CoSoVatChat", "maTaiSan", maTaiSan));
        facility.setTinhTrang(tinhTrang);
        return inventoryMapper.toDTO(csvcRepository.save(facility));
    }

    @Override
    @Transactional
    public CoSoVatChatDTO addFacilitySupplier(String maTaiSan, String tenNhaCungCap) {
        CoSoVatChat facility = csvcRepository.findById(maTaiSan)
                .orElseThrow(() -> new ResourceNotFoundException("CoSoVatChat", "maTaiSan", maTaiSan));
        facility.getNhaCungCap().add(tenNhaCungCap.trim());
        return inventoryMapper.toDTO(csvcRepository.save(facility));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CoSoVatChatDTO> getAllFacilities(Pageable pageable) {
        Page<CoSoVatChatDTO> page = csvcRepository.findAll(pageable).map(inventoryMapper::toDTO);
        return PageResponse.fromPage(page);
    }

    /**
     * Khởi tạo mới nguyên liệu trong bảng {@code nguyenlieu} kèm nhà cung cấp trong {@code cungcapnl};
     * kiểm tra trùng khóa chính, xác thực hạn sử dụng không nằm trong quá khứ và nhân viên quản lý hợp lệ.
     */
    @Override
    @Transactional
    public NguyenLieuDTO createIngredient(NguyenLieuDTO dto) {
        if (nguyenLieuRepository.existsById(dto.getMaNguyenLieu())) {
            throw new BusinessConflictException("Mã nguyên liệu '" + dto.getMaNguyenLieu() + "' đã tồn tại");
        }
        if (dto.getHanSuDung() != null && dto.getHanSuDung().isBefore(LocalDate.now())) {
            throw new BusinessConflictException(
                    ErrorCode.INGREDIENT_EXPIRED,
                    "Không thể thêm nguyên liệu đã quá hạn sử dụng"
            );
        }

        NhanVien manager = resolveActiveManager(dto.getMaNVQuanLy());
        NguyenLieu saved = nguyenLieuRepository.save(inventoryMapper.toEntity(dto, manager));
        return inventoryMapper.toDTO(saved);
    }

    /**
     * Cộng dồn số lượng nhập kho cho nguyên liệu hiện có: kiểm tra lượng nhập phải lớn hơn 0
     * và chặn nhập thêm vào lô nguyên liệu đã hết hạn sử dụng.
     */
    @Override
    @Transactional
    public NguyenLieuDTO importIngredientStock(String maNguyenLieu, BigDecimal additionalQuantity) {
        if (additionalQuantity == null || additionalQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessConflictException(ErrorCode.VALIDATION_ERROR, "Số lượng nhập kho phải lớn hơn 0");
        }

        NguyenLieu ingredient = nguyenLieuRepository.findById(maNguyenLieu)
                .orElseThrow(() -> new ResourceNotFoundException("NguyenLieu", "maNguyenLieu", maNguyenLieu));

        if (ingredient.getHanSuDung() != null && ingredient.getHanSuDung().isBefore(LocalDate.now())) {
            throw new BusinessConflictException(
                    ErrorCode.INGREDIENT_EXPIRED,
                    "Nguyên liệu '" + ingredient.getTenNguyenLieu() + "' đã hết hạn, vui lòng tạo lô mới"
            );
        }

        ingredient.setLuongTon(ingredient.getLuongTon().add(additionalQuantity));
        return inventoryMapper.toDTO(nguyenLieuRepository.save(ingredient));
    }

    @Override
    @Transactional
    public NguyenLieuDTO addIngredientSupplier(String maNguyenLieu, String tenNhaCungCap) {
        NguyenLieu ingredient = nguyenLieuRepository.findById(maNguyenLieu)
                .orElseThrow(() -> new ResourceNotFoundException("NguyenLieu", "maNguyenLieu", maNguyenLieu));
        ingredient.getNhaCungCap().add(tenNhaCungCap.trim());
        return inventoryMapper.toDTO(nguyenLieuRepository.save(ingredient));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NguyenLieuDTO> getIngredientsByDishName(String tenMon) {
        return nguyenLieuRepository.findIngredientsByDishName(tenMon).stream()
                .map(inventoryMapper::toDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NguyenLieuDTO> getExpiringIngredients(int daysAhead) {
        LocalDate thresholdDate = LocalDate.now().plusDays(Math.max(daysAhead, 0));
        return nguyenLieuRepository.findByHanSuDungLessThanEqual(thresholdDate).stream()
                .map(inventoryMapper::toDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NguyenLieuDTO> getLowStockIngredients(BigDecimal threshold) {
        return nguyenLieuRepository.findByLuongTonLessThanEqual(threshold).stream()
                .map(inventoryMapper::toDTO)
                .toList();
    }

    private NhanVien resolveActiveManager(String maNVQuanLy) {
        if (!StringUtils.hasText(maNVQuanLy)) {
            return null;
        }
        NhanVien manager = nhanVienRepository.findById(maNVQuanLy)
                .orElseThrow(() -> new ResourceNotFoundException("NhanVien", "maNV", maNVQuanLy));
        if (manager.getTrangThaiLamViec() != TrangThaiLamViec.DANG_LAM_VIEC) {
            throw new BusinessConflictException(
                    ErrorCode.VALIDATION_ERROR,
                    "Nhân viên được phân công quản lý hiện không ở trạng thái làm việc"
            );
        }
        return manager;
    }
}
