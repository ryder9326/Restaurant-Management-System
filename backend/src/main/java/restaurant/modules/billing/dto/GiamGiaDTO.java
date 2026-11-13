package restaurant.modules.billing.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Đối tượng truyền tải dữ liệu quản lý chương trình khuyến mãi và mã giảm giá.
 * Kết nối với thực thể {@code GiamGia}, {@code HoaDonMapper}, {@code BillingAndAnalyticsServiceImpl}
 * và {@code BillingAndAnalyticsController}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiamGiaDTO {

    @NotBlank(message = "Mã giảm giá không được để trống")
    @Size(max = 20, message = "Mã giảm giá tối đa 20 ký tự")
    private String maGiamGia;

    @NotNull(message = "Giá trị ưu đãi không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị ưu đãi phải lớn hơn 0")
    private BigDecimal giaTriUuDai;

    @Size(max = 255, message = "Điều kiện áp dụng tối đa 255 ký tự")
    private String dieuKienApDung;

    @NotNull(message = "Thời hạn sử dụng không được để trống")
    private LocalDate thoiHan;
}
