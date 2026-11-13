package restaurant.modules.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import restaurant.common.response.ApiResponse;
import restaurant.modules.auth.dto.JwtAuthResponseDTO;
import restaurant.modules.auth.dto.LoginRequestDTO;
import restaurant.modules.auth.dto.RefreshTokenRequestDTO;
import restaurant.modules.auth.dto.UserProfileResponseDTO;
import restaurant.modules.auth.service.AuthService;

/**
 * Bộ điều khiển REST API tiếp nhận các yêu cầu xác thực tài khoản, làm mới JWT Token và xem hồ sơ cá nhân.
 * Kết nối trực tiếp với {@code AuthService} để xử lý nghiệp vụ bảo mật, tuân thủ cấu hình phân quyền
 * tại {@code SecurityConfig} và trả về dữ liệu chuẩn hóa thông qua {@code ApiResponse}.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtAuthResponseDTO>> login(@Valid @RequestBody LoginRequestDTO request) {
        JwtAuthResponseDTO authResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(authResponse, "Đăng nhập thành công"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<JwtAuthResponseDTO>> refreshToken(
            @Valid @RequestBody RefreshTokenRequestDTO request) {
        JwtAuthResponseDTO authResponse = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(authResponse, "Làm mới token thành công"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponseDTO>> getCurrentProfile() {
        UserProfileResponseDTO profile = authService.getCurrentProfile();
        return ResponseEntity.ok(ApiResponse.success(profile, "Lấy thông tin tài khoản thành công"));
    }
}
