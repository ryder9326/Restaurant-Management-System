package restaurant.modules.menuorder.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import restaurant.modules.menuorder.entity.ThucDon;

import java.util.List;

/**
 * Giao diện truy xuất dữ liệu danh mục món ăn từ bảng {@code thucdon} trong MySQL.
 * Kết nối với {@code MenuOrderServiceImpl} và {@code BillingAndAnalyticsServiceImpl}
 * để tìm kiếm món ăn theo từ khóa và xác thực đơn giá khi lập hóa đơn.
 */
@Repository
public interface ThucDonRepository extends JpaRepository<ThucDon, String> {

    List<ThucDon> findByTenMonContainingIgnoreCase(String keyword);
}
