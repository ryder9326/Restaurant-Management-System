package restaurant.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Đối tượng đóng gói cấu trúc JSON trả về cho Client mỗi khi phát sinh ngoại lệ.
 * Kết nối với {@code GlobalExceptionHandler} và {@code JwtAuthenticationEntryPoint} để cung cấp
 * đầy đủ ngữ cảnh lỗi gồm thời gian, mã HTTP, mã lỗi nghiệp vụ, đường dẫn API và chi tiết từng
 * trường vi phạm validation (nếu có).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private LocalDateTime timestamp;
    private int status;
    private int errorCode;
    private String error;
    private String message;
    private String path;
    private Map<String, String> validationErrors;
}