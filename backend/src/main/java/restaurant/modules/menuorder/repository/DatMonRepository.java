package restaurant.modules.menuorder.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import restaurant.modules.menuorder.dto.CustomerDishOrderProjection;
import restaurant.modules.menuorder.dto.DishStatusStatProjection;
import restaurant.modules.menuorder.entity.DatMon;
import restaurant.modules.menuorder.entity.id.DatMonId;

import java.time.LocalDate;
import java.util.List;

/**
 * Giao diện truy xuất dữ liệu lịch sử gọi món từ bảng {@code datmon} (sử dụng khóa phức hợp {@code DatMonId}).
 * Kết nối với {@code MenuOrderServiceImpl} và thực thi hai câu truy vấn thống kê trạng thái món ăn
 * trong ngày và tra cứu món gọi theo số điện thoại khách hàng theo yêu cầu báo cáo.
 */
@Repository
public interface DatMonRepository extends JpaRepository<DatMon, DatMonId> {

    @Query(value = """
        SELECT dm.MaMon AS maMon,
               td.TenMon AS tenMon,
               COUNT(dm.TrangThai) AS soLuong,
               dm.TrangThai AS trangThai
        FROM datmon dm
        JOIN thucdon td ON td.MaMon = dm.MaMon
        WHERE DATE(dm.ThoiGianGoi) = :targetDate
        GROUP BY dm.TrangThai, dm.MaMon, td.TenMon
    """, nativeQuery = true)
    List<DishStatusStatProjection> countDishStatusByDate(@Param("targetDate") LocalDate targetDate);

    @Query(value = """
        SELECT dm.MaKH AS maKH,
               kh.HoVaTen AS hoVaTen,
               dm.MaMon AS maMon,
               td.TenMon AS tenMon,
               dm.GhiChu AS ghiChu,
               dm.TrangThai AS trangThai
        FROM datmon dm
        JOIN khachhang kh ON kh.MaKH = dm.MaKH
        JOIN thucdon td ON td.MaMon = dm.MaMon
        WHERE kh.SDT = :sdt
          AND DATE(dm.ThoiGianGoi) = :targetDate
    """, nativeQuery = true)
    List<CustomerDishOrderProjection> findCustomerOrdersByPhoneAndDate(
            @Param("sdt") String sdt,
            @Param("targetDate") LocalDate targetDate
    );
}
