package restaurant.modules.billing.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import restaurant.modules.billing.entity.GiamGia;

import java.time.LocalDate;
import java.util.List;

/**
 * Giao diện truy xuất dữ liệu mã giảm giá từ bảng {@code giamgia} trong MySQL.
 * Kết nối với {@code BillingAndAnalyticsServiceImpl} để lọc các mã khuyến mãi còn hiệu lực
 * và xác thực điều kiện ưu đãi khi lập hóa đơn hoặc thanh toán.
 */
@Repository
public interface GiamGiaRepository extends JpaRepository<GiamGia, String> {

    List<GiamGia> findByThoiHanGreaterThanEqual(LocalDate currentDate);
}
