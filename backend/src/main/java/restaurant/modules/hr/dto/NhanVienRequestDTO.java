package restaurant.modules.hr.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import restaurant.modules.hr.enums.TrangThaiLamViec;

import java.time.LocalDate;

/**
 * Đối tượng truyền tải dữ liệu đầu vào khi tạo mới hoặc cập nhật hồ sơ nhân viên.
 * Kết nối với {@code NhanVienController} (kiểm tra ràng buộc dữ liệu qua {@code @Valid}),
 * {@code NhanVienMapper} và {@code NhanVienServiceImpl} để lưu thông tin xuống bảng {@code nhanvien}
 * cùng quan hệ phân cấp quản lý {@code quanlynv}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NhanVienRequestDTO {

    @NotBlank(message = "Mã nhân viên không được để trống")
    @Size(max = 20, message = "Mã nhân viên tối đa 20 ký tự")
    private String maNV;

    @NotBlank(message = "Họ và tên nhân viên không được để trống")
    @Size(max = 100, message = "Họ và tên tối đa 100 ký tự")
    private String hoVaTen;

    @Min(value = 18, message = "Tuổi nhân viên phải từ 18 trở lên")
    @Max(value = 70, message = "Tuổi nhân viên không hợp lệ")
    private Integer tuoi;

    @NotBlank(message = "Chức vụ không được để trống")
    @Size(max = 50, message = "Chức vụ tối đa 50 ký tự")
    private String chucVu;

    private LocalDate ngayBatDau;

    @NotNull(message = "Trạng thái làm việc không được để trống")
    private TrangThaiLamViec trangThaiLamViec;

    @Size(max = 50, message = "Tên đăng nhập tối đa 50 ký tự")
    private String username;

    @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6 đến 100 ký tự")
    private String password;

    private String maNVQuanLy;
}