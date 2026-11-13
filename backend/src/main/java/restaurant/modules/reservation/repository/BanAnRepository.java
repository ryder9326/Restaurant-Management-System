package restaurant.modules.reservation.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import restaurant.modules.reservation.dto.AreaReservationCountProjection;
import restaurant.modules.reservation.entity.BanAn;
import restaurant.modules.reservation.enums.TrangThaiBan;

import java.util.List;
import java.util.Optional;

/**
 * Giao diện truy xuất dữ liệu sơ đồ bàn ăn trong bảng {@code banan}.
 * Kết nối với {@code ReservationServiceImpl} và {@code NhanVienServiceImpl}, đồng thời thực thi
 * câu truy vấn thống kê số lượt đặt bàn theo từng khu vực theo yêu cầu báo cáo.
 */
@Repository
public interface BanAnRepository extends JpaRepository<BanAn, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ba FROM BanAn ba WHERE ba.maBan = :maBan")
    Optional<BanAn> findByIdForUpdate(@Param("maBan") String maBan);

    List<BanAn> findByKhuVucAndTrangThaiSuDung(String khuVuc, TrangThaiBan trangThaiSuDung);

    List<BanAn> findByTrangThaiSuDung(TrangThaiBan trangThaiSuDung);

    @Query(value = """
        SELECT ba.KhuVuc AS khuVuc,
               COUNT(db.MaDatBan) AS soLuotDatBan
        FROM banan ba
        LEFT JOIN datban db ON ba.MaBan = db.MaBan
        GROUP BY ba.KhuVuc
    """, nativeQuery = true)
    List<AreaReservationCountProjection> countReservationsByArea();
}
