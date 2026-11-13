package restaurant.modules.billing.enums;

/**
 * Định nghĩa các hình thức thanh toán hóa đơn được nhà hàng hỗ trợ.
 * Kết nối với thực thể {@code ThanhToan} (cột {@code PhuongThuc}) và {@code ThanhToanRequestDTO}
 * để ghi nhận phương thức giao dịch của khách hàng khi tất toán hóa đơn.
 */
public enum PhuongThucThanhToan {
    TIEN_MAT,
    CHUYEN_KHOAN,
    THE_NGAN_HANG,
    VI_DIEN_TU
}