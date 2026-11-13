package restaurant.modules.menuorder.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Đối tượng truyền tải dữ liệu đầu vào khi khách hàng gọi món mới.
 * Kết nối với {@code MenuOrderController} (kiểm tra ràng buộc {@code @Valid})
 * và {@code MenuOrderServiceImpl} để tạo bản ghi gọi món {@code DatMon}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatMonRequestDTO {

    @NotBlank(message = "Mã khách hàng không được để trống")
    private String maKH;

    @NotBlank(message = "Mã món ăn không được để trống")
    private String maMon;

    @NotNull(message = "Số lượng gọi món không được để trống")
    @Min(value = 1, message = "Số lượng gọi món phải từ 1 trở lên")
    private Integer soLuong;

    @Size(max = 255, message = "Ghi chú chế biến tối đa 255 ký tự")
    private String ghiChu;
}
