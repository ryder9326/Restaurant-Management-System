package restaurant.modules.billing.dto;

import java.math.BigDecimal;

/**
 * Interface Projection hứng kết quả thống kê số lượng hóa đơn và tổng doanh thu theo từng khu vực bàn ăn.
 * Kết nối trực tiếp với {@code HoaDonRepository.findRevenueStatsByArea()} để ánh xạ dữ liệu tổng hợp
 * từ các bảng {@code banan}, {@code datban}, {@code bantronghoadon} và {@code hoadon}.
 */
public interface AreaRevenueStatProjection {
    String getKhuVuc();
    Long getSoLuongHoaDon();
    BigDecimal getTongDoanhThu();
}
