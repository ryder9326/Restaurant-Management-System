package restaurant.common.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import restaurant.modules.hr.entity.NhanVien;
import restaurant.modules.hr.repository.NhanVienRepository;

/**
 * Dịch vụ tải thông tin tài khoản nhân viên từ CSDL MySQL phục vụ cơ chế xác thực của Spring Security.
 * Kết nối trực tiếp với {@code NhanVienRepository} để truy vấn bản ghi {@code NhanVien} theo {@code username},
 * chuyển đổi sang {@code CustomUserDetails} và cung cấp dữ liệu cho {@code AuthenticationManager} cũng như
 * bộ lọc {@code JwtAuthenticationFilter}.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final NhanVienRepository nhanVienRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        NhanVien nhanVien = nhanVienRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản nhân viên: " + username));
        return CustomUserDetails.fromNhanVien(nhanVien);
    }
}
