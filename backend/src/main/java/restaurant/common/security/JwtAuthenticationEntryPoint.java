package restaurant.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import restaurant.common.exception.ErrorCode;
import restaurant.common.exception.ErrorResponse;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Điểm xử lý lỗi xác thực (HTTP 401 Unauthorized) tại tầng Filter của Spring Security trước khi vào Controller.
 * Kết nối với {@code SecurityConfig}, {@code ErrorCode} và {@code ErrorResponse} để đảm bảo các request
 * thiếu token hoặc gửi token hết hạn/sai chữ ký nhận về cấu trúc JSON đồng nhất với {@code GlobalExceptionHandler}.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException {
        ErrorCode errorCode = ErrorCode.UNAUTHENTICATED;
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(errorCode.getHttpStatus().value())
                .errorCode(errorCode.getCode())
                .error(errorCode.getHttpStatus().getReasonPhrase())
                .message(errorCode.getDefaultMessage())
                .path(request.getRequestURI())
                .build();

        response.setStatus(errorCode.getHttpStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getOutputStream(), errorResponse);
    }
}
