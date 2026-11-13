package restaurant.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * Bảng mã lỗi nghiệp vụ và mã trạng thái HTTP chuẩn hóa cho toàn bộ hệ thống.
 * Kết nối trực tiếp với {@code AppException}, các lớp ngoại lệ con và {@code GlobalExceptionHandler}
 * để ánh xạ thống nhất mọi tình huống lỗi đặc thù của nhà hàng (hết bàn, thiếu nguyên liệu,
 * mã giảm giá hết hạn, sai trạng thái thanh toán) sang phản hồi HTTP tương ứng.
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    UNCATEGORIZED_EXCEPTION(9999, HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống không xác định"),
    VALIDATION_ERROR(1001, HttpStatus.BAD_REQUEST, "Dữ liệu đầu vào không hợp lệ"),
    RESOURCE_NOT_FOUND(1002, HttpStatus.NOT_FOUND, "Không tìm thấy tài nguyên yêu cầu"),
    DUPLICATE_RESOURCE(1003, HttpStatus.CONFLICT, "Dữ liệu đã tồn tại trong hệ thống"),
    UNAUTHENTICATED(1004, HttpStatus.UNAUTHORIZED, "Chưa xác thực hoặc token không hợp lệ"),
    UNAUTHORIZED_ACCESS(1005, HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này"),

    TABLE_NOT_AVAILABLE(2001, HttpStatus.CONFLICT, "Bàn ăn hiện không trống hoặc đã được đặt trước"),
    TABLE_CAPACITY_EXCEEDED(2002, HttpStatus.BAD_REQUEST, "Số lượng khách vượt quá sức chứa của bàn"),
    INSUFFICIENT_INGREDIENT_STOCK(2003, HttpStatus.BAD_REQUEST, "Số lượng nguyên liệu tồn kho không đủ"),
    INGREDIENT_EXPIRED(2004, HttpStatus.BAD_REQUEST, "Nguyên liệu đã quá hạn sử dụng"),
    EXPIRED_DISCOUNT_VOUCHER(2005, HttpStatus.BAD_REQUEST, "Mã giảm giá đã hết hạn hoặc không đủ điều kiện áp dụng"),
    INVALID_ORDER_STATUS(2006, HttpStatus.BAD_REQUEST, "Trạng thái món ăn không hợp lệ để thực hiện cập nhật"),
    INVALID_PAYMENT_STATE(2007, HttpStatus.CONFLICT, "Hóa đơn đã được thanh toán hoặc trạng thái giao dịch không hợp lệ");

    private final int code;
    private final HttpStatus httpStatus;
    private final String defaultMessage;
}