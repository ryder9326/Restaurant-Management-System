package restaurant.common.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import restaurant.modules.auth.enums.Role;
import restaurant.modules.hr.entity.NhanVien;
import restaurant.modules.hr.enums.TrangThaiLamViec;

import java.util.Collection;
import java.util.List;

/**
 * Lớp bọc thông tin định danh và quyền hạn của nhân viên theo chuẩn {@code UserDetails} của Spring Security.
 * Kết nối với thực thể {@code NhanVien}, enum {@code Role} và được khởi tạo bởi {@code CustomUserDetailsService}
 * để lưu trữ trong {@code SecurityContextHolder}, phục vụ quá trình xác thực đăng nhập và phân quyền tại tầng Controller.
 */
@Getter
@Builder
@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final String maNV;
    private final String username;
    private final String password;
    private final Role role;
    private final boolean active;

    public static CustomUserDetails fromNhanVien(NhanVien nhanVien) {
        return CustomUserDetails.builder()
                .maNV(nhanVien.getMaNV())
                .username(nhanVien.getUsername())
                .password(nhanVien.getPasswordHash())
                .role(mapChucVuToRole(nhanVien.getChucVu()))
                .active(nhanVien.getTrangThaiLamViec() == TrangThaiLamViec.DANG_LAM_VIEC)
                .build();
    }

    private static Role mapChucVuToRole(String chucVu) {
        if (chucVu == null) {
            return Role.ROLE_WAITER;
        }
        return switch (chucVu.trim().toUpperCase()) {
            case "ADMIN", "QUAN_TRI_VIEN" -> Role.ROLE_ADMIN;
            case "MANAGER", "QUAN_LY" -> Role.ROLE_MANAGER;
            case "RECEPTIONIST", "LE_TAN" -> Role.ROLE_RECEPTIONIST;
            case "CASHIER", "THU_NGAN" -> Role.ROLE_CASHIER;
            case "INVENTORY_STAFF", "THU_KHO" -> Role.ROLE_INVENTORY_STAFF;
            default -> Role.ROLE_WAITER;
        };
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
