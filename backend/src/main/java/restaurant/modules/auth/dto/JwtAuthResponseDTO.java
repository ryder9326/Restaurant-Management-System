package restaurant.modules.auth.dto;

import lombok.*;
import restaurant.modules.auth.enums.Role;

/**
 * Đối tượng đóng gói thông tin phiên đăng nhập và cặp JWT Token trả về cho Client sau khi xác thực thành công.
 * Kết nối với {@code AuthServiceImpl} và {@code AuthController} (bọc trong {@code ApiResponse})
 * để cung cấp {@code accessToken}, {@code refreshToken} cùng thông tin định danh và vai trò của nhân viên.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JwtAuthResponseDTO {

    private String accessToken;
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private String maNV;
    private String username;
    private String hoVaTen;
    private String chucVu;
    private Role role;
}
