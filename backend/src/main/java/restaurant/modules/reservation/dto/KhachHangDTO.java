package restaurant.modules.reservation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Đối tượng truyền tải dữ liệu thông tin khách hàng khi đăng ký mới, cập nhật hoặc trả về qua API.
 * Kết nối với thực thể {@code KhachHang}, {@code ReservationMapper}, {@code ReservationServiceImpl}
 * và {@code ReservationController}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KhachHangDTO {

    @NotBlank(message = "Mã khách hàng không được để trống")
    @Size(max = 20, message = "Mã khách hàng tối đa 20 ký tự")
    private String maKH;

    @NotBlank(message = "Họ và tên khách hàng không được để trống")
    @Size(max = 100, message = "Họ và tên tối đa 100 ký tự")
    private String hoVaTen;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{8,10}$", message = "Số điện thoại không đúng định dạng Việt Nam")
    private String sdt;

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String ghiChu;
}
