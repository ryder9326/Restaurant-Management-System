package restaurant.modules.menuorder.dto;

/**
 * Interface Projection hứng kết quả thống kê số lượng món ăn theo từng trạng thái phục vụ trong ngày.
 * Kết nối trực tiếp với {@code DatMonRepository.countDishStatusByDate()} để ánh xạ kết quả câu lệnh
 * {@code GROUP BY dm.TrangThai, dm.MaMon, td.TenMon} giữa hai bảng {@code datmon} và {@code thucdon}.
 */
public interface DishStatusStatProjection {
    String getMaMon();
    String getTenMon();
    Long getSoLuong();
    String getTrangThai();
}
