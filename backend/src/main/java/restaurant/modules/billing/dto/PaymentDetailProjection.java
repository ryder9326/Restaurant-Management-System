package restaurant.modules.billing.dto;


import java.math.BigDecimal;

/**
 * Interface Projection hứng kết quả truy vấn chi tiết lịch sử thanh toán của khách hàng.
 * Kết nối trực tiếp với {@code ThanhToanRepository.findAllCustomerPaymentDetails()} để ánh xạ dữ liệu
 * từ các bảng {@code thanhtoan}, {@code khachhang} và {@code hoadon}.
 */
public interface PaymentDetailProjection {
    String getTenKhachHang();
    String getMaHD();
    BigDecimal getTongTien();
    BigDecimal getGiamGia();
    String getPhuongThuc();
    String getTrangThaiThanhToan();
}
