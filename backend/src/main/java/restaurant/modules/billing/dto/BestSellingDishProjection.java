package restaurant.modules.billing.dto;

/**
 * Interface Projection hứng kết quả thống kê tổng số lượng bán ra của từng món ăn trong các hóa đơn.
 * Kết nối trực tiếp với {@code MonAnTrongHoaDonRepository.findBestSellingDishes()} để ánh xạ kết quả
 * câu lệnh {@code GROUP BY td.MaMon, td.TenMon} giữa hai bảng {@code monantronghoadon} và {@code thucdon}.
 */
public interface BestSellingDishProjection {
    String getTenMon();
    Long getTongSoLuongDaBan();
}
