package restaurant.modules.hr.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import restaurant.modules.hr.dto.ActiveTableServiceProjection;
import restaurant.modules.hr.entity.NhanVien;

import java.util.List;
import java.util.Optional;

/**
 * Giao diện truy xuất dữ liệu MySQL cho thực thể {@code NhanVien} và các bảng liên kết nhân sự.
 * Kết nối với {@code CustomUserDetailsService} (truy vấn tài khoản theo {@code username}),
 * {@code NhanVienServiceImpl} và thực thi câu truy vấn kiểm tra nhân viên đang phục vụ bàn nào
 * cho khách hàng nào.
 */
@Repository
public interface NhanVienRepository extends JpaRepository<NhanVien, String> {

    Optional<NhanVien> findByUsername(String username);

    boolean existsByUsername(String username);

    List<NhanVien> findByChucVu(String chucVu);

    @Query("SELECT nv FROM NhanVien nv JOIN nv.nguoiQuanLy ql WHERE ql.maNV = :maNVQuanLy")
    List<NhanVien> findSubordinatesByManagerId(@Param("maNVQuanLy") String maNVQuanLy);

    @Query(value = """
        SELECT nv.HoVaTen AS tenNhanVien,
               ba.KhuVuc AS khuVuc,
               ba.MaBan AS maBan,
               kh.HoVaTen AS tenKhachHang
        FROM phucvu pv
        JOIN nhanvien nv ON pv.MaNV = nv.MaNV
        JOIN banan ba ON pv.MaBan = ba.MaBan
        JOIN ngoi n ON ba.MaBan = n.MaBan
        JOIN khachhang kh ON n.MaKH = kh.MaKH
    """, nativeQuery = true)
    List<ActiveTableServiceProjection> findActiveServingStaffAndCustomers();
}
