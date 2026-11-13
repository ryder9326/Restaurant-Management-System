package restaurant.modules.auth.dto;

import lombok.*;
import restaurant.modules.auth.enums.Role;
import restaurant.modules.hr.enums.TrangThaiLamViec;

import java.time.LocalDate;

/**
 * Đối tượng trả về thông tin hồ sơ cá nhân của nhân viên đang đăng nhập hiện tại.
 * Kết nối với {@code AuthServiceImpl} và {@code AuthController} (endpoint {@code /auth/me})
 * để hiển thị thông tin tài khoản trên giao diện mà không làm lộ trường mật khẩu mã hóa từ {@code NhanVien}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponseDTO {

    private String maNV;
    private String hoVaTen;
    private Integer tuoi;
    private String chucVu;
    private LocalDate ngayBatDau;
    private TrangThaiLamViec trangThaiLamViec;
    private String username;
    private Role role;
}
