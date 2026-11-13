package restaurant.modules.billing.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import restaurant.common.exception.BusinessConflictException;
import restaurant.common.exception.ErrorCode;
import restaurant.common.exception.ResourceNotFoundException;
import restaurant.modules.billing.dto.*;
import restaurant.modules.billing.entity.GiamGia;
import restaurant.modules.billing.entity.HoaDon;
import restaurant.modules.billing.entity.MonAnTrongHoaDon;
import restaurant.modules.billing.entity.ThanhToan;
import restaurant.modules.billing.entity.id.MonAnTrongHoaDonId;
import restaurant.modules.billing.entity.id.ThanhToanId;
import restaurant.modules.billing.enums.TrangThaiThanhToan;
import restaurant.modules.billing.mapper.HoaDonMapper;
import restaurant.modules.billing.repository.GiamGiaRepository;
import restaurant.modules.billing.repository.HoaDonRepository;
import restaurant.modules.billing.repository.MonAnTrongHoaDonRepository;
import restaurant.modules.billing.repository.ThanhToanRepository;
import restaurant.modules.billing.service.BillingAndAnalyticsService;
import restaurant.modules.menuorder.entity.ThucDon;
import restaurant.modules.menuorder.repository.ThucDonRepository;
import restaurant.modules.reservation.entity.DatBan;
import restaurant.modules.reservation.entity.KhachHang;
import restaurant.modules.reservation.repository.DatBanRepository;
import restaurant.modules.reservation.repository.KhachHangRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Lớp triển khai toàn bộ nghiệp vụ của phân hệ Hóa đơn, Giảm giá, Thanh toán & Thống kê Doanh thu.
 * Kết nối với {@code HoaDonRepository}, {@code MonAnTrongHoaDonRepository}, {@code GiamGiaRepository},
 * {@code ThanhToanRepository}, {@code ThucDonRepository}, {@code DatBanRepository},
 * {@code KhachHangRepository} và {@code HoaDonMapper} để tính toán giá trị hóa đơn, kiểm soát hiệu lực
 * mã ưu đãi, ghi nhận giao dịch thanh toán và cung cấp dữ liệu báo cáo kinh doanh.
 */
@Service
@RequiredArgsConstructor
public class BillingAndAnalyticsServiceImpl implements BillingAndAnalyticsService {

    private final HoaDonRepository hoaDonRepository;
    private final MonAnTrongHoaDonRepository monAnTrongHoaDonRepository;
    private final GiamGiaRepository giamGiaRepository;
    private final ThanhToanRepository thanhToanRepository;
    private final ThucDonRepository thucDonRepository;
    private final DatBanRepository datBanRepository;
    private final KhachHangRepository khachHangRepository;
    private final HoaDonMapper hoaDonMapper;

    /**
     * Khởi tạo mới mã giảm giá vào bảng {@code giamgia}: kiểm tra trùng khóa chính {@code MaGiamGia}
     * và đảm bảo thời hạn hiệu lực không nằm trong quá khứ.
     */
    @Override
    @Transactional
    public GiamGiaDTO createDiscount(GiamGiaDTO dto) {
        if (giamGiaRepository.existsById(dto.getMaGiamGia())) {
            throw new BusinessConflictException("Mã giảm giá '" + dto.getMaGiamGia() + "' đã tồn tại");
        }
        if (dto.getThoiHan().isBefore(LocalDate.now())) {
            throw new BusinessConflictException(
                    ErrorCode.EXPIRED_DISCOUNT_VOUCHER,
                    "Thời hạn mã giảm giá không được nhỏ hơn ngày hiện tại"
            );
        }

        GiamGia saved = giamGiaRepository.save(hoaDonMapper.toEntity(dto));
        return hoaDonMapper.toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GiamGiaDTO> getActiveDiscounts() {
        return giamGiaRepository.findByThoiHanGreaterThanEqual(LocalDate.now()).stream()
                .map(hoaDonMapper::toDTO)
                .toList();
    }

    /**
     * Lập hóa đơn mới ({@code HoaDon}): ghi nhận đơn giá tại thời điểm bán ({@code donGiaLucBan})
     * cho từng món ăn, kiểm tra điều kiện giá trị đơn tối thiểu của các mã giảm giá trước khi khấu trừ.
     */
    @Override
    @Transactional
    public HoaDonResponseDTO createInvoice(HoaDonRequestDTO dto) {
        if (hoaDonRepository.existsById(dto.getMaHD())) {
            throw new BusinessConflictException("Mã hóa đơn '" + dto.getMaHD() + "' đã tồn tại");
        }

        Set<DatBan> datBanSet = resolveReservations(dto.getMaDatBanList());

        HoaDon hoaDon = HoaDon.builder()
                .maHD(dto.getMaHD())
                .tongTien(BigDecimal.ZERO)
                .danhSachDatBan(datBanSet)
                .build();

        BigDecimal grossAmount = BigDecimal.ZERO;
        Set<MonAnTrongHoaDon> lineItems = new HashSet<>();

        for (Map.Entry<String, Integer> entry : dto.getMonAnSoLuongMap().entrySet()) {
            String maMon = entry.getKey();
            Integer quantity = entry.getValue();
            if (quantity == null || quantity <= 0) {
                throw new BusinessConflictException(
                        ErrorCode.VALIDATION_ERROR,
                        "Số lượng của món '" + maMon + "' phải lớn hơn 0"
                );
            }

            ThucDon thucDon = thucDonRepository.findById(maMon)
                    .orElseThrow(() -> new ResourceNotFoundException("ThucDon", "maMon", maMon));

            BigDecimal snapshotPrice = thucDon.getGiaBan();
            BigDecimal lineTotal = snapshotPrice.multiply(BigDecimal.valueOf(quantity));
            grossAmount = grossAmount.add(lineTotal);

            MonAnTrongHoaDon lineItem = MonAnTrongHoaDon.builder()
                    .id(new MonAnTrongHoaDonId(hoaDon.getMaHD(), thucDon.getMaMon()))
                    .hoaDon(hoaDon)
                    .thucDon(thucDon)
                    .soLuong(quantity)
                    .donGiaLucBan(snapshotPrice)
                    .build();
            lineItems.add(lineItem);
        }

        Set<GiamGia> validDiscounts = resolveAndValidateDiscounts(dto.getMaGiamGiaList(), grossAmount, null);

        BigDecimal totalDiscount = validDiscounts.stream()
                .map(GiamGia::getGiaTriUuDai)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netTotal = grossAmount.subtract(totalDiscount).max(BigDecimal.ZERO);
        hoaDon.setTongTien(netTotal);
        hoaDon.setDanhSachGiamGia(validDiscounts);
        hoaDon.setChiTietMonAn(lineItems);

        HoaDon saved = hoaDonRepository.save(hoaDon);
        return hoaDonMapper.toHoaDonResponseDTO(saved);
    }

    /**
     * Xử lý giao dịch thanh toán đồng bộ bằng khóa bi quan ({@code findDetailByMaHDForUpdate}):
     * chặn tuyệt đối 2 yêu cầu đồng thời thanh toán cùng một hóa đơn, xác thực khách hàng thanh toán
     * phải khớp với khách đặt bàn của hóa đơn, kiểm tra lịch sử sử dụng mã giảm giá ({@code sudunggiamgia})
     * và điều kiện đơn hàng tối thiểu trước khi tất toán.
     */
    @Override
    @Transactional
    public ThanhToanResponseDTO processPayment(ThanhToanRequestDTO dto) {
        HoaDon hoaDon = hoaDonRepository.findDetailByMaHDForUpdate(dto.getMaHD())
                .orElseThrow(() -> new ResourceNotFoundException("HoaDon", "maHD", dto.getMaHD()));
        KhachHang khachHang = khachHangRepository.findById(dto.getMaKH())
                .orElseThrow(() -> new ResourceNotFoundException("KhachHang", "maKH", dto.getMaKH()));

        if (thanhToanRepository.existsByHoaDon_MaHDAndTrangThai(
                hoaDon.getMaHD(), TrangThaiThanhToan.DA_THANH_TOAN)) {
            throw new BusinessConflictException(
                    ErrorCode.INVALID_PAYMENT_STATE,
                    "Hóa đơn '" + hoaDon.getMaHD() + "' đã được thanh toán hoàn tất"
            );
        }

        validateCustomerInvoiceOwnership(khachHang, hoaDon);

        BigDecimal grossAmount = calculateGrossAmount(hoaDon);
        Set<GiamGia> existingDiscounts = hoaDon.getDanhSachGiamGia();
        for (GiamGia existingDiscount : existingDiscounts) {
            validateCustomerHasNotUsedVoucher(khachHang, existingDiscount);
        }

        Set<GiamGia> extraDiscounts = resolveAndValidateDiscounts(dto.getMaGiamGiaApDung(), grossAmount, khachHang);
        BigDecimal extraDiscountAmount = BigDecimal.ZERO;

        for (GiamGia discount : extraDiscounts) {
            if (hoaDon.getDanhSachGiamGia().add(discount)) {
                extraDiscountAmount = extraDiscountAmount.add(discount.getGiaTriUuDai());
            }
        }

        if (extraDiscountAmount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal updatedTotal = hoaDon.getTongTien().subtract(extraDiscountAmount).max(BigDecimal.ZERO);
            hoaDon.setTongTien(updatedTotal);
            hoaDonRepository.save(hoaDon);
        }

        if (!hoaDon.getDanhSachGiamGia().isEmpty()) {
            khachHang.getMaGiamGiaDaDung().addAll(hoaDon.getDanhSachGiamGia());
            khachHangRepository.save(khachHang);
        }

        BigDecimal totalDiscountValue = hoaDon.getDanhSachGiamGia().stream()
                .map(GiamGia::getGiaTriUuDai)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        ThanhToanId paymentId = new ThanhToanId(khachHang.getMaKH(), hoaDon.getMaHD());
        ThanhToan thanhToan = ThanhToan.builder()
                .id(paymentId)
                .khachHang(khachHang)
                .hoaDon(hoaDon)
                .phuongThuc(dto.getPhuongThuc())
                .giamGia(totalDiscountValue)
                .trangThai(TrangThaiThanhToan.DA_THANH_TOAN)
                .build();

        ThanhToan savedPayment = thanhToanRepository.save(thanhToan);
        return hoaDonMapper.toThanhToanResponseDTO(savedPayment);
    }

    private void validateCustomerInvoiceOwnership(KhachHang khachHang, HoaDon hoaDon) {
        if (hoaDon.getDanhSachDatBan() == null || hoaDon.getDanhSachDatBan().isEmpty()) {
            return;
        }
        boolean isOwner = hoaDon.getDanhSachDatBan().stream()
                .anyMatch(db -> db.getKhachHang().getMaKH().equals(khachHang.getMaKH()));
        if (!isOwner) {
            throw new BusinessConflictException(
                    ErrorCode.INVALID_PAYMENT_STATE,
                    "Khách hàng '" + khachHang.getMaKH() + "' không thuộc phiếu đặt bàn của hóa đơn này"
            );
        }
    }

    private BigDecimal calculateGrossAmount(HoaDon hoaDon) {
        return hoaDon.getChiTietMonAn().stream()
                .map(item -> {
                    BigDecimal price = item.getDonGiaLucBan() != null
                            ? item.getDonGiaLucBan()
                            : item.getThucDon().getGiaBan();
                    return price.multiply(BigDecimal.valueOf(item.getSoLuong()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Set<GiamGia> resolveAndValidateDiscounts(
            Set<String> discountIds,
            BigDecimal grossAmount,
            KhachHang khachHang) {
        if (discountIds == null || discountIds.isEmpty()) {
            return new HashSet<>();
        }
        List<GiamGia> discounts = giamGiaRepository.findAllById(discountIds);
        if (discounts.size() != discountIds.size()) {
            throw new ResourceNotFoundException("Một hoặc nhiều mã giảm giá không tồn tại");
        }

        LocalDate today = LocalDate.now();
        for (GiamGia discount : discounts) {
            if (discount.getThoiHan().isBefore(today)) {
                throw new BusinessConflictException(
                        ErrorCode.EXPIRED_DISCOUNT_VOUCHER,
                        "Mã giảm giá '" + discount.getMaGiamGia() + "' đã hết hạn sử dụng"
                );
            }
            validateDiscountMinimumOrderCondition(discount, grossAmount);
            if (khachHang != null) {
                validateCustomerHasNotUsedVoucher(khachHang, discount);
            }
        }
        return new HashSet<>(discounts);
    }

    private void validateCustomerHasNotUsedVoucher(KhachHang khachHang, GiamGia discount) {
        boolean alreadyUsed = khachHang.getMaGiamGiaDaDung().stream()
                .anyMatch(used -> used.getMaGiamGia().equals(discount.getMaGiamGia()));
        if (alreadyUsed) {
            throw new BusinessConflictException(
                    ErrorCode.EXPIRED_DISCOUNT_VOUCHER,
                    "Khách hàng đã sử dụng mã giảm giá '" + discount.getMaGiamGia() + "' trước đó"
            );
        }
    }

    private void validateDiscountMinimumOrderCondition(GiamGia discount, BigDecimal grossAmount) {
        String condition = discount.getDieuKienApDung();
        if (condition == null || condition.isBlank()) {
            return;
        }
        String digitsOnly = condition.replaceAll("[^0-9]", "");
        if (!digitsOnly.isEmpty()) {
            BigDecimal minOrderAmount = new BigDecimal(digitsOnly);
            if (grossAmount.compareTo(minOrderAmount) < 0) {
                throw new BusinessConflictException(
                        ErrorCode.EXPIRED_DISCOUNT_VOUCHER,
                        String.format("Mã giảm giá '%s' yêu cầu tổng tiền món tối thiểu %s (hiện tại: %s)",
                                discount.getMaGiamGia(), minOrderAmount, grossAmount)
                );
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public HoaDonResponseDTO getInvoiceDetail(String maHD) {
        HoaDon hoaDon = hoaDonRepository.findDetailByMaHD(maHD)
                .orElseThrow(() -> new ResourceNotFoundException("HoaDon", "maHD", maHD));
        return hoaDonMapper.toHoaDonResponseDTO(hoaDon);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BestSellingDishProjection> getBestSellingDishes() {
        return monAnTrongHoaDonRepository.findBestSellingDishes();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AreaRevenueStatProjection> getRevenueStatsByArea() {
        return hoaDonRepository.findRevenueStatsByArea();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDiscountCountProjection> getDiscountCountByCustomerName(String hoVaTen) {
        return hoaDonRepository.countDiscountsUsedByCustomerName(hoVaTen);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentDetailProjection> getAllPaymentDetails() {
        return thanhToanRepository.findAllCustomerPaymentDetails();
    }

    private Set<DatBan> resolveReservations(Set<String> reservationIds) {
        if (reservationIds == null || reservationIds.isEmpty()) {
            return new HashSet<>();
        }
        List<DatBan> reservations = datBanRepository.findAllById(reservationIds);
        if (reservations.size() != reservationIds.size()) {
            throw new ResourceNotFoundException("Một hoặc nhiều mã đặt bàn không tồn tại trong hệ thống");
        }
        return new HashSet<>(reservations);
    }

    private Set<GiamGia> resolveAndValidateDiscounts(Set<String> discountIds) {
        if (discountIds == null || discountIds.isEmpty()) {
            return new HashSet<>();
        }
        List<GiamGia> discounts = giamGiaRepository.findAllById(discountIds);
        if (discounts.size() != discountIds.size()) {
            throw new ResourceNotFoundException("Một hoặc nhiều mã giảm giá không tồn tại");
        }

        LocalDate today = LocalDate.now();
        for (GiamGia discount : discounts) {
            if (discount.getThoiHan().isBefore(today)) {
                throw new BusinessConflictException(
                        ErrorCode.EXPIRED_DISCOUNT_VOUCHER,
                        "Mã giảm giá '" + discount.getMaGiamGia() + "' đã hết hạn sử dụng"
                );
            }
        }
        return new HashSet<>(discounts);
    }
}
