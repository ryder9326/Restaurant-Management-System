package restaurant.modules.hr.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import restaurant.modules.hr.entity.CaLamViec;
import restaurant.modules.hr.entity.id.CaLamViecId;

import java.time.LocalDate;
import java.util.List;

/**
 * Giao diện truy xuất dữ liệu lịch phân ca trực của nhân viên trong bảng {@code calamviec}.
 * Kết nối với thực thể {@code CaLamViec} (sử dụng khóa phức hợp {@code CaLamViecId})
 * và {@code NhanVienServiceImpl} để kiểm tra trùng ca và thống kê lịch làm việc theo ngày.
 */
@Repository
public interface CaLamViecRepository extends JpaRepository<CaLamViec, CaLamViecId> {

    List<CaLamViec> findByIdNgayLamViec(LocalDate ngayLamViec);

    List<CaLamViec> findByIdMaNVAndIdNgayLamViecBetween(String maNV, LocalDate startDate, LocalDate endDate);
}