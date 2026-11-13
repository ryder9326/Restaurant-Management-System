package restaurant.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Lớp bọc (Wrapper) chuẩn hóa cấu trúc dữ liệu JSON trả về cho mọi API thành công trong hệ thống.
 * Kết nối với toàn bộ các lớp {@code @RestController} ở 6 phân hệ nghiệp vụ, đảm bảo Frontend luôn
 * nhận được định dạng phản hồi thống nhất gồm mã trạng thái ({@code code}), thông điệp ({@code message}),
 * dữ liệu nghiệp vụ ({@code data}) và dấu thời gian ({@code timestamp}).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    @Builder.Default
    private int code = 1000;

    private String message;
    private T data;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .code(1000)
                .message("Thành công")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .code(1000)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
}