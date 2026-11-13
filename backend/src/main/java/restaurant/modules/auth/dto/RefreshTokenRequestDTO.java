package restaurant.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Đối tượng truyền tải dữ liệu đầu vào khi yêu cầu cấp lại Access Token mới từ Refresh Token.
 * Kết nối với {@code AuthController} và {@code AuthServiceImpl} nhằm duy trì phiên đăng nhập
 * của nhân viên mà không yêu cầu nhập lại mật khẩu.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshTokenRequestDTO {

    @NotBlank(message = "Refresh token không được để trống")
    private String refreshToken;
}
