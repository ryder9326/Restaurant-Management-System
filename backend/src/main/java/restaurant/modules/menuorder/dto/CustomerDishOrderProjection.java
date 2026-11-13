package restaurant.modules.menuorder.dto;

/**
 * Interface Projection hứng kết quả tra cứu danh sách món ăn đã gọi của một khách hàng theo số điện thoại và ngày.
 * Kết nối trực tiếp với {@code DatMonRepository.findCustomerOrdersByPhoneAndDate()} để ánh xạ dữ liệu
 * liên kết từ các bảng {@code datmon}, {@code khachhang} và {@code thucdon}.
 */
public interface CustomerDishOrderProjection {
    String getMaKH();
    String getHoVaTen();
    String getMaMon();
    String getTenMon();
    String getGhiChu();
    String getTrangThai();
}