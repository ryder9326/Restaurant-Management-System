package restaurant.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * Kích hoạt và cấu hình cơ chế tự động ghi nhận lịch sử tác động dữ liệu (JPA Auditing).
 * Kết nối với lớp cơ sở {@code BaseAuditEntity} để tự động điền thời gian tạo/cập nhật bản ghi
 * xuống MySQL, đồng thời liên kết với {@code SecurityContextHolder} của Spring Security để lấy
 * danh tính nhân viên đang đăng nhập gán vào các trường {@code createdBy} và {@code updatedBy}.
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaAuditingConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null
                    || !authentication.isAuthenticated()
                    || authentication instanceof AnonymousAuthenticationToken) {
                return Optional.of("SYSTEM");
            }
            return Optional.ofNullable(authentication.getName());
        };
    }
}