package restaurant.modules.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import restaurant.modules.inventory.entity.NguyenLieu;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Giao diện truy xuất dữ liệu kho nguyên liệu trong bảng {@code nguyenlieu} và các quan hệ liên kết.
 * Kết nối với {@code InventoryServiceImpl} và {@code MenuOrderServiceImpl}, đồng thời thực thi
 * câu truy vấn đa bảng lấy toàn bộ nguyên liệu cấu thành nên một món ăn theo tên món trong báo cáo.
 */
@Repository
public interface NguyenLieuRepository extends JpaRepository<NguyenLieu, String> {

    List<NguyenLieu> findByHanSuDungLessThanEqual(LocalDate targetDate);

    List<NguyenLieu> findByLuongTonLessThanEqual(BigDecimal threshold);

    @Modifying
    @Query("""
        UPDATE NguyenLieu nl
        SET nl.luongTon = nl.luongTon - :requiredAmount
        WHERE nl.maNguyenLieu = :maNguyenLieu
          AND nl.luongTon >= :requiredAmount
          AND (nl.hanSuDung IS NULL OR nl.hanSuDung >= :currentDate)
    """)
    int deductStockAtomically(
            @Param("maNguyenLieu") String maNguyenLieu,
            @Param("requiredAmount") BigDecimal requiredAmount,
            @Param("currentDate") LocalDate currentDate
    );

    @Modifying
    @Query("UPDATE NguyenLieu nl SET nl.luongTon = nl.luongTon + :restoredAmount WHERE nl.maNguyenLieu = :maNguyenLieu")
    int restoreStockAtomically(
            @Param("maNguyenLieu") String maNguyenLieu,
            @Param("restoredAmount") BigDecimal restoredAmount
    );

    @Query(value = """
        SELECT nl.*
        FROM nguyenlieu nl
        JOIN nguyenlieumonan nlma ON nl.MaNguyenLieu = nlma.MaNguyenLieu
        JOIN thucdon td ON nlma.MaMon = td.MaMon
        WHERE td.TenMon = :tenMon
    """, nativeQuery = true)
    List<NguyenLieu> findIngredientsByDishName(@Param("tenMon") String tenMon);
}