package restaurant.modules.billing.dto;

/**
 * Interface Projection hứng kết quả đếm số lượng mã giảm giá đã sử dụng trên từng hóa đơn của một khách hàng.
 * Kết nối trực tiếp với {@code HoaDonRepository.countDiscountsUsedByCustomerName()} để ánh xạ dữ liệu
 * từ các bảng {@code hoadon}, {@code magiamgiahoadon}, {@code sudunggiamgia} và {@code khachhang}.
 */
public interface InvoiceDiscountCountProjection {
    String getMaHD();
    Long getSoLuongMaGiamGia();
}
