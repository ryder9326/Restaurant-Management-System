package restaurant.modules.reservation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import restaurant.modules.reservation.enums.TrangThaiBan;

/**
 * Đối tượng truyền tải dữ liệu quản lý sơ đồ bàn ăn, khu vực, sức chứa và trạng thái sử dụng.
 * Kết nối với thực thể {@code BanAn}, {@code ReservationMapper}, {@code ReservationServiceImpl}
 * và {@code ReservationController}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BanAnDTO {

    @NotBlank(message = "Mã bàn không được để trống")
    @Size(max = 20, message = "Mã bàn tối đa 20 ký tự")
    private String maBan;

    @NotBlank(message = "Khu vực không được để trống")
    @Size(max = 50, message = "Khu vực tối đa 50 ký tự")
    private String khuVuc;

    @NotNull(message = "Sức chứa không được để trống")
    @Min(value = 1, message = "Sức chứa của bàn phải lớn hơn hoặc bằng 1")
    private Integer sucChua;

    @NotNull(message = "Trạng thái sử dụng bàn không được để trống")
    private TrangThaiBan trangThaiSuDung;
}
