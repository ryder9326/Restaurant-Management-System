package restaurant.modules.auth.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import restaurant.common.exception.AppException;
import restaurant.common.exception.ErrorCode;
import restaurant.common.exception.ResourceNotFoundException;
import restaurant.common.security.CustomUserDetails;
import restaurant.common.security.CustomUserDetailsService;
import restaurant.common.security.JwtTokenProvider;
import restaurant.modules.auth.dto.JwtAuthResponseDTO;
import restaurant.modules.auth.dto.LoginRequestDTO;
import restaurant.modules.auth.dto.RefreshTokenRequestDTO;
import restaurant.modules.auth.dto.UserProfileResponseDTO;
import restaurant.modules.auth.service.AuthService;
import restaurant.modules.hr.entity.NhanVien;
import restaurant.modules.hr.repository.NhanVienRepository;

/**
 * Lớp triển khai nghiệp vụ xác thực và quản lý phiên đăng nhập bằng JWT cho nhân viên nhà hàng.
 * Kết nối trực tiếp với {@code AuthenticationManager} của Spring Security, {@code JwtTokenProvider},
 * {@code CustomUserDetailsService} và {@code NhanVienRepository} để xác minh thông tin đăng nhập,
 * kiểm tra trạng thái công tác và cấp phát cặp Access/Refresh Token.
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final NhanVienRepository nhanVienRepository;

    /**
     * Xác thực thông tin đăng nhập của nhân viên thông qua {@code AuthenticationManager},
     * lưu ngữ cảnh xác thực vào {@code SecurityContextHolder}, truy xuất hồ sơ {@code NhanVien}
     * và khởi tạo cặp Access Token cùng Refresh Token trả về cho Client.
     */
    @Override
    @Transactional(readOnly = true)
    public JwtAuthResponseDTO login(LoginRequestDTO request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        NhanVien nhanVien = nhanVienRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("NhanVien", "username", userDetails.getUsername()));

        String accessToken = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(userDetails.getUsername());

        return JwtAuthResponseDTO.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .maNV(nhanVien.getMaNV())
                .username(nhanVien.getUsername())
                .hoVaTen(nhanVien.getHoVaTen())
                .chucVu(nhanVien.getChucVu())
                .role(userDetails.getRole())
                .build();
    }

    /**
     * Kiểm tra tính hợp lệ của Refresh Token, tải lại thông tin tài khoản từ CSDL để đảm bảo
     * nhân viên vẫn đang ở trạng thái {@code DANG_LAM_VIEC}, sau đó cấp phát cặp token mới.
     */
    @Override
    @Transactional(readOnly = true)
    public JwtAuthResponseDTO refreshToken(RefreshTokenRequestDTO request) {
        String rawRefreshToken = request.getRefreshToken();
        if (!tokenProvider.validateToken(rawRefreshToken)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED, "Refresh token không hợp lệ hoặc đã hết hạn");
        }

        String username = tokenProvider.getUsernameFromToken(rawRefreshToken);
        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(username);
        if (!userDetails.isEnabled()) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS, "Tài khoản nhân viên đã bị khóa hoặc ngừng hoạt động");
        }

        NhanVien nhanVien = nhanVienRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("NhanVien", "username", username));

        String newAccessToken = tokenProvider.generateTokenFromUserDetails(userDetails);
        String newRefreshToken = tokenProvider.generateRefreshToken(username);

        return JwtAuthResponseDTO.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .maNV(nhanVien.getMaNV())
                .username(nhanVien.getUsername())
                .hoVaTen(nhanVien.getHoVaTen())
                .chucVu(nhanVien.getChucVu())
                .role(userDetails.getRole())
                .build();
    }

    /**
     * Trích xuất danh tính nhân viên đang đăng nhập từ {@code SecurityContextHolder}
     * và truy vấn bản ghi {@code NhanVien} tương ứng trong MySQL để trả về thông tin hồ sơ chi tiết.
     */
    @Override
    @Transactional(readOnly = true)
    public UserProfileResponseDTO getCurrentProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        NhanVien nhanVien = nhanVienRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("NhanVien", "username", userDetails.getUsername()));

        return UserProfileResponseDTO.builder()
                .maNV(nhanVien.getMaNV())
                .hoVaTen(nhanVien.getHoVaTen())
                .tuoi(nhanVien.getTuoi())
                .chucVu(nhanVien.getChucVu())
                .ngayBatDau(nhanVien.getNgayBatDau())
                .trangThaiLamViec(nhanVien.getTrangThaiLamViec())
                .username(nhanVien.getUsername())
                .role(userDetails.getRole())
                .build();
    }
}