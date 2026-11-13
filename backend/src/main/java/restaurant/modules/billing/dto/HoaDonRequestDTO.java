package restaurant.modules.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Đối tượng truyền tải dữ liệu đầu vào khi khởi tạo hóa đơn thanh toán cho khách hàng.
 * Kết nối với {@code BillingAndAnalyticsController} (kiểm tra ràng buộc {@code @Valid})
 * và {@code BillingAndAnalyticsServiceImpl} để tổng hợp danh sách món ăn, phiếu đặt bàn và mã giảm giá.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoaDonRequestDTO {

    @NotBlank(message = "Mã hóa đơn không được để trống")
    @Size(max = 20, message = "Mã hóa đơn tối đa 20 ký tự")
    private String maHD;

    @Builder.Default
    private Set<String> maDatBanList = new HashSet<>();

    @NotEmpty(message = "Hóa đơn phải có ít nhất một món ăn")
    @Builder.Default
    private Map<String, Integer> monAnSoLuongMap = new HashMap<>();

    @Builder.Default
    private Set<String> maGiamGiaList = new HashSet<>();
}
