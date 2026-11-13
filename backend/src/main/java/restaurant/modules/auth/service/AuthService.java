package restaurant.modules.auth.service;

import restaurant.modules.auth.dto.JwtAuthResponseDTO;
import restaurant.modules.auth.dto.LoginRequestDTO;
import restaurant.modules.auth.dto.RefreshTokenRequestDTO;
import restaurant.modules.auth.dto.UserProfileResponseDTO;

/**
 * Giao diện định nghĩa các nghiệp vụ xác thực, cấp phát JWT Token và truy xuất hồ sơ người dùng hiện tại.
 * Kết nối {@code AuthController} với lớp thực thi {@code AuthServiceImpl} để tách biệt tầng giao tiếp HTTP
 * khỏi logic bảo mật.
 */
public interface AuthService {

    JwtAuthResponseDTO login(LoginRequestDTO request);

    JwtAuthResponseDTO refreshToken(RefreshTokenRequestDTO request);

    UserProfileResponseDTO getCurrentProfile();
}