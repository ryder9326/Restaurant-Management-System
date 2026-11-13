package restaurant.modules.reservation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import restaurant.modules.reservation.entity.KhachHang;

import java.util.List;
import java.util.Optional;

/**
 * Giao diện truy xuất dữ liệu khách hàng từ bảng {@code khachhang} trong MySQL.
 * Kết nối với {@code ReservationServiceImpl}, {@code NhanVienServiceImpl}, {@code MenuOrderServiceImpl}
 * và {@code BillingAndAnalyticsServiceImpl} để tra cứu khách hàng theo mã định danh hoặc số điện thoại.
 */
@Repository
public interface KhachHangRepository extends JpaRepository<KhachHang, String> {

    Optional<KhachHang> findBySdt(String sdt);

    boolean existsBySdt(String sdt);

    List<KhachHang> findByHoVaTenContainingIgnoreCase(String hoVaTen);
}
