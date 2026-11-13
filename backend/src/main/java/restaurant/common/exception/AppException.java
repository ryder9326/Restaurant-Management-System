package restaurant.common.exception;

import lombok.Getter;

/**
 * Lớp ngoại lệ gốc (RuntimeException) đại diện cho toàn bộ lỗi nghiệp vụ trong ứng dụng.
 * Kết nối với {@code ErrorCode} để mang thông tin định danh lỗi và được ném ra từ các lớp
 * {@code Service} trong từng phân hệ, sau đó được {@code GlobalExceptionHandler} bắt và xử lý tập trung.
 */
@Getter
public class AppException extends RuntimeException {

    private final ErrorCode errorCode;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }

    public AppException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
    }
}
