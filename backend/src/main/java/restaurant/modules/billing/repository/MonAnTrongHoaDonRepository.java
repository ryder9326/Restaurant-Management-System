package restaurant.modules.billing.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import restaurant.modules.billing.dto.BestSellingDishProjection;
import restaurant.modules.billing.entity.MonAnTrongHoaDon;
import restaurant.modules.billing.entity.id.MonAnTrongHoaDonId;

import java.util.List;

/**
 * Giao diện truy xuất dữ liệu chi tiết món ăn trong hóa đơn từ bảng {@code monantronghoadon}.
 * Kết nối với {@code BillingAndAnalyticsServiceImpl} và thực thi câu truy vấn thống kê
 * số lượng bán ra của từng món ăn xếp theo thứ tự bán chạy nhất trong báo cáo.
 */
@Repository
public interface MonAnTrongHoaDonRepository extends JpaRepository<MonAnTrongHoaDon, MonAnTrongHoaDonId> {

    @Query(value = """
        SELECT td.TenMon AS tenMon,
               SUM(mhd.SoLuong) AS tongSoLuongDaBan
        FROM monantronghoadon mhd
        JOIN thucdon td ON mhd.MaMon = td.MaMon
        GROUP BY td.MaMon, td.TenMon
        ORDER BY tongSoLuongDaBan DESC
    """, nativeQuery = true)
    List<BestSellingDishProjection> findBestSellingDishes();
}
