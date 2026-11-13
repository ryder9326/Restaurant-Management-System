package restaurant.modules.billing.dto;
import lombok.*;
import restaurant.modules.billing.enums.PhuongThucThanhToan;
import restaurant.modules.billing.enums.TrangThaiThanhToan;

import java.math.BigDecimal;

/**
 * Đối tượng đóng gói biên lai giao dịch thanh toán trả về cho Client sau khi tất toán hóa đơn.
 * Kết nối với thực thể {@code ThanhToan}, {@code HoaDonMapper}, {@code BillingAndAnalyticsServiceImpl}
 * và {@code BillingAndAnalyticsController}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThanhToanResponseDTO {

    private String maKH;
    private String tenKhachHang;
    private String maHD;
    private BigDecimal tongTienThanhToan;
    private BigDecimal tongTienGiamGia;
    private PhuongThucThanhToan phuongThuc;
    private TrangThaiThanhToan trangThai;
}