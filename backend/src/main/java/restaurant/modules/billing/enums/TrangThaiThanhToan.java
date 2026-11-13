package restaurant.modules.billing.enums;

/**
 * Biểu diễn trạng thái xử lý của giao dịch thanh toán hóa đơn.
 * Kết nối với thực thể {@code ThanhToan} (cột {@code TrangThai}) và {@code BillingAndAnalyticsServiceImpl}
 * để kiểm soát trạng thái tất toán và ngăn chặn việc thanh toán trùng lặp trên cùng một hóa đơn.
 */
public enum TrangThaiThanhToan {
    CHO_THANH_TOAN,
    DA_THANH_TOAN,
    HOAN_TIEN,
    THAT_BAI
}
