package restaurant.modules.menuorder.dto;

import lombok.*;
import restaurant.modules.menuorder.enums.TrangThaiDatMon;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Đối tượng đóng gói chi tiết lượt gọi món trả về cho Client sau khi đặt món hoặc cập nhật trạng thái bếp.
 * Kết nối với thực thể {@code DatMon}, {@code MenuOrderMapper}, {@code MenuOrderServiceImpl}
 * và {@code MenuOrderController}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatMonResponseDTO {

    private String maKH;
    private String tenKhachHang;
    private String maMon;
    private String tenMon;
    private LocalDateTime thoiGianGoi;
    private Integer soLuong;
    private TrangThaiDatMon trangThai;
    private String ghiChu;
    private BigDecimal thanhTien;
}
