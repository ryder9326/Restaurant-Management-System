package restaurant.modules.hr.dto;

/**
 * Interface Projection hứng kết quả truy vấn liên kết đa bảng giữa nhân viên phục vụ, bàn ăn và khách hàng.
 * Kết nối trực tiếp với {@code NhanVienRepository.findActiveServingStaffAndCustomers()} để ánh xạ
 * dữ liệu từ các bảng {@code phucvu}, {@code nhanvien}, {@code banan}, {@code ngoi} và {@code khachhang}.
 */
public interface ActiveTableServiceProjection {
    String getTenNhanVien();
    String getKhuVuc();
    String getMaBan();
    String getTenKhachHang();
}
