package restaurant.common.exception;

/**
 * Ngoại lệ chuyên biệt dùng khi không tìm thấy bản ghi thực thể trong CSDL MySQL.
 * Kế thừa {@code AppException} với mã lỗi cố định {@code ErrorCode.RESOURCE_NOT_FOUND} (HTTP 404),
 * kết nối trực tiếp với tầng {@code Service} của tất cả các phân hệ (như tra cứu Nhân viên, Bàn ăn,
 * Thực đơn, Hóa đơn) khi thực hiện các thao tác {@code findById(...).orElseThrow(...)}.
 */
public class ResourceNotFoundException extends AppException {

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(
                ErrorCode.RESOURCE_NOT_FOUND,
                String.format("Không tìm thấy %s với %s = '%s'", resourceName, fieldName, fieldValue)
        );
    }

    public ResourceNotFoundException(String customMessage) {
        super(ErrorCode.RESOURCE_NOT_FOUND, customMessage);
    }
}