package restaurant.modules.billing.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

/**
 * Đối tượng đóng gói thông tin chi tiết hóa đơn trả về cho Client sau khi lập hoặc tra cứu hóa đơn.
 * Kết nối với thực thể {@code HoaDon}, {@code MonAnTrongHoaDon}, {@code HoaDonMapper}
 * và {@code BillingAndAnalyticsController}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoaDonResponseDTO {

    private String maHD;
    private BigDecimal tongTien;
    private Set<String> danhSachMaDatBan;
    private Set<String> danhSachMaGiamGia;
    private List<ChiTietMonHoaDonDTO> chiTietMonAn;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChiTietMonHoaDonDTO {
        private String maMon;
        private String tenMon;
        private BigDecimal donGia;
        private Integer soLuong;
        private BigDecimal thanhTien;
    }
}
