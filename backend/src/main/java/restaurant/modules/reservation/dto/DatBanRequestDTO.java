package restaurant.modules.reservation.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Đối tượng truyền tải dữ liệu tạo mới hoặc hiển thị phiếu đặt bàn trước của khách hàng.
 * Kết nối với thực thể {@code DatBan}, {@code KhachHang}, {@code BanAn}, {@code ReservationServiceImpl}
 * và {@code ReservationController}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatBanRequestDTO {

    @NotBlank(message = "Mã đặt bàn không được để trống")
    @Size(max = 20, message = "Mã đặt bàn tối đa 20 ký tự")
    private String maDatBan;

    @NotBlank(message = "Mã khách hàng không được để trống")
    private String maKH;

    @NotBlank(message = "Mã bàn không được để trống")
    private String maBan;

    @NotNull(message = "Thời gian đặt bàn không được để trống")
    @FutureOrPresent(message = "Thời gian đặt bàn phải từ thời điểm hiện tại trở đi")
    private LocalDateTime thoiGianDat;

    @NotNull(message = "Số lượng khách không được để trống")
    @Min(value = 1, message = "Số lượng khách phải từ 1 người trở lên")
    private Integer soLuongKhach;

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String ghiChu;
}