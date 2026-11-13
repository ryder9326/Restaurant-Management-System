package restaurant.modules.reservation.dto;

/**
 * Interface Projection hứng kết quả thống kê tổng số lượt đặt bàn theo từng khu vực nhà hàng.
 * Kết nối trực tiếp với {@code BanAnRepository.countReservationsByArea()} để ánh xạ kết quả câu lệnh
 * {@code GROUP BY ba.KhuVuc} giữa hai bảng {@code banan} và {@code datban}.
 */
public interface AreaReservationCountProjection {
    String getKhuVuc();
    Long getSoLuotDatBan();
}
