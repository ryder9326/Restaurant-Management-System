package restaurant.modules.reservation.dto;

import java.time.LocalDateTime;

/**
 * Interface Projection hứng kết quả truy vấn chi tiết phiếu đặt bàn kết hợp thông tin khách hàng và khu vực.
 * Kết nối trực tiếp với {@code DatBanRepository.findAllReservationDetails()} để ánh xạ dữ liệu từ
 * các bảng {@code datban}, {@code khachhang} và {@code banan}.
 */
public interface ReservationDetailProjection {
    String getMaDatBan();
    String getHoVaTen();
    String getSdt();
    String getKhuVuc();
    LocalDateTime getThoiGianDat();
}
