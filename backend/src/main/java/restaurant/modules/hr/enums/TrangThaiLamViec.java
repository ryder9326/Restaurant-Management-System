package restaurant.modules.hr.enums;

/**
 * Biểu diễn trạng thái công tác hiện tại của nhân viên trong nhà hàng.
 * Kết nối với thực thể {@code NhanVien} (cột {@code TrangThaiLamViec} trong MySQL) và
 * {@code CustomUserDetails} để tự động khóa quyền đăng nhập đối với nhân viên nghỉ phép hoặc đã nghỉ việc.
 */
public enum TrangThaiLamViec {
    DANG_LAM_VIEC,
    NGHI_PHEP,
    DA_NGHI_VIEC
}
