package restaurant.common.config;


import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình tài liệu hóa API tự động theo chuẩn OpenAPI 3 (Swagger UI).
 * Kết nối với toàn bộ các lớp {@code @RestController} trong các phân hệ nghiệp vụ và tích hợp
 * với cơ chế bảo mật {@code JwtAuthenticationFilter} thông qua Bearer Token scheme, giúp đội ngũ
 * phát triển kiểm thử trực tiếp các endpoint yêu cầu xác thực ngay trên giao diện Swagger.
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI restaurantOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Restaurant Management System API")
                        .description("Hệ thống Quản lý Nhà hàng - Nhóm 06 - RESTFul API")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Nhóm 06 - SoICT HUST")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}