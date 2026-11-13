package restaurant.modules.billing.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import restaurant.modules.billing.dto.AreaRevenueStatProjection;
import restaurant.modules.billing.dto.InvoiceDiscountCountProjection;
import restaurant.modules.billing.entity.HoaDon;

import java.util.List;
import java.util.Optional;

/**
 * Giao diện truy xuất dữ liệu hóa đơn từ bảng {@code hoadon} và các bảng liên kết hóa đơn.
 * Kết nối với {@code BillingAndAnalyticsServiceImpl}, thực thi truy vấn tải chi tiết hóa đơn
 * cùng các truy vấn thống kê doanh thu theo khu vực và số lượng mã giảm giá đã dùng của khách hàng.
 */
@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, String> {

    @Query("""
        SELECT DISTINCT hd FROM HoaDon hd
        LEFT JOIN FETCH hd.chiTietMonAn ct
        LEFT JOIN FETCH ct.thucDon
        LEFT JOIN FETCH hd.danhSachGiamGia
        LEFT JOIN FETCH hd.danhSachDatBan
        WHERE hd.maHD = :maHD
    """)
    Optional<HoaDon> findDetailByMaHD(@Param("maHD") String maHD);

    @Query(value = """
        SELECT ba.KhuVuc AS khuVuc,
               COUNT(hd.MaHD) AS soLuongHoaDon,
               SUM(hd.TongTien) AS tongDoanhThu
        FROM banan ba
        JOIN datban db ON ba.MaBan = db.MaBan
        JOIN bantronghoadon bthd ON db.MaDatBan = bthd.MaDatBan
        JOIN hoadon hd ON bthd.MaHD = hd.MaHD
        GROUP BY ba.KhuVuc
        ORDER BY tongDoanhThu DESC
    """, nativeQuery = true)
    List<AreaRevenueStatProjection> findRevenueStatsByArea();

    @Query(value = """
        SELECT hd.MaHD AS maHD,
               COUNT(DISTINCT mgghd.MaGiamGia) AS soLuongMaGiamGia
        FROM hoadon hd
        JOIN magiamgiahoadon mgghd ON hd.MaHD = mgghd.MaHD
        JOIN sudunggiamgia sdgg ON mgghd.MaGiamGia = sdgg.MaGiamGia
        JOIN khachhang kh ON sdgg.MaKH = kh.MaKH
        WHERE kh.HoVaTen = :hoVaTen
        GROUP BY hd.MaHD
    """, nativeQuery = true)
    List<InvoiceDiscountCountProjection> countDiscountsUsedByCustomerName(@Param("hoVaTen") String hoVaTen);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT DISTINCT hd FROM HoaDon hd
        LEFT JOIN FETCH hd.chiTietMonAn ct
        LEFT JOIN FETCH ct.thucDon
        LEFT JOIN FETCH hd.danhSachGiamGia
        LEFT JOIN FETCH hd.danhSachDatBan db
        LEFT JOIN FETCH db.khachHang
        WHERE hd.maHD = :maHD
    """)
    Optional<HoaDon> findDetailByMaHDForUpdate(@Param("maHD") String maHD);
}
