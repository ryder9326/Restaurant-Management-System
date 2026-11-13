package restaurant.modules.reservation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import restaurant.modules.reservation.dto.ReservationDetailProjection;
import restaurant.modules.reservation.entity.DatBan;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Giao diện truy xuất dữ liệu đặt bàn trước từ bảng {@code datban} trong MySQL.
 * Kết nối với {@code ReservationServiceImpl} và {@code BillingAndAnalyticsServiceImpl} để kiểm tra
 * xung đột khung giờ đặt bàn và truy xuất thông tin chi tiết đặt bàn kèm thông tin khách hàng.
 */
@Repository
public interface DatBanRepository extends JpaRepository<DatBan, String> {

    @Query("""
        SELECT COUNT(db) > 0 FROM DatBan db
        WHERE db.banAn.maBan = :maBan
          AND db.thoiGianDat BETWEEN :startWindow AND :endWindow
    """)
    boolean existsOverlappingReservation(
            @Param("maBan") String maBan,
            @Param("startWindow") LocalDateTime startWindow,
            @Param("endWindow") LocalDateTime endWindow
    );

    @Query(value = """
        SELECT db.MaDatBan AS maDatBan,
               kh.HoVaTen AS hoVaTen,
               kh.SDT AS sdt,
               ba.KhuVuc AS khuVuc,
               db.ThoiGianDat AS thoiGianDat
        FROM datban db
        JOIN khachhang kh ON db.MaKH = kh.MaKH
        JOIN banan ba ON db.MaBan = ba.MaBan
        ORDER BY db.ThoiGianDat DESC
    """, nativeQuery = true)
    List<ReservationDetailProjection> findAllReservationDetails();
}
