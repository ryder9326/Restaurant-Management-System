package restaurant.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Đối tượng truyền tải dữ liệu đầu vào cho yêu cầu đăng nhập hệ thống.
 * Kết nối với {@code AuthController} (nhận dữ liệu JSON kèm kiểm tra {@code @Valid})
 * và {@code AuthServiceImpl} để thực hiện xác thực tài khoản nhân viên.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequestDTO {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}
