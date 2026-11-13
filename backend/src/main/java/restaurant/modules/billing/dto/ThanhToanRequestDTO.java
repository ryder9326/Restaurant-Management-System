package restaurant.modules.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import restaurant.modules.billing.enums.PhuongThucThanhToan;

import java.util.HashSet;
import java.util.Set;

/**
 * Đối tượng truyền tải dữ liệu đầu vào khi khách hàng thực hiện giao dịch thanh toán hóa đơn.
 * Kết nối với {@code BillingAndAnalyticsController} và {@code BillingAndAnalyticsServiceImpl}
 * để ghi nhận phương thức thanh toán, áp dụng bổ sung mã giảm giá và chốt giao dịch vào bảng {@code thanhtoan}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThanhToanRequestDTO {

    @NotBlank(message = "Mã khách hàng không được để trống")
    private String maKH;

    @NotBlank(message = "Mã hóa đơn không được để trống")
    private String maHD;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PhuongThucThanhToan phuongThuc;

    @Builder.Default
    private Set<String> maGiamGiaApDung = new HashSet<>();
}
