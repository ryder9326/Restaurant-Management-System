package restaurant.common.exception;


/**
 * Ngoại lệ chuyên biệt dùng khi thao tác vi phạm ràng buộc nghiệp vụ hoặc xung đột trạng thái dữ liệu.
 * Kế thừa {@code AppException} và kết nối với tầng {@code Service} của các phân hệ (Đặt bàn trùng giờ,
 * trùng mã khóa chính, áp mã giảm giá hết hạn, thanh toán lại hóa đơn đã hoàn tất) để ngăn chặn
 * ghi dữ liệu sai lệch xuống MySQL.
 */
public class BusinessConflictException extends AppException {

    public BusinessConflictException(ErrorCode errorCode) {
        super(errorCode);
    }

    public BusinessConflictException(ErrorCode errorCode, String customMessage) {
        super(errorCode, customMessage);
    }

    public BusinessConflictException(String customMessage) {
        super(ErrorCode.DUPLICATE_RESOURCE, customMessage);
    }
}