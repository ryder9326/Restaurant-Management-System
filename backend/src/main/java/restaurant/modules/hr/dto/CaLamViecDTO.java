package restaurant.modules.hr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import restaurant.modules.hr.enums.BuoiLamViec;

import java.time.LocalDate;

/**
 * Đối tượng truyền tải dữ liệu phân công và tra cứu ca làm việc của nhân viên theo ngày.
 * Kết nối với thực thể {@code CaLamViec} (cùng khóa phức hợp {@code CaLamViecId}),
 * {@code NhanVienMapper}, {@code NhanVienServiceImpl} và {@code NhanVienController}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaLamViecDTO {

    @NotBlank(message = "Mã nhân viên không được để trống")
    private String maNV;

    private String tenNhanVien;

    @NotNull(message = "Buổi làm việc không được để trống")
    private BuoiLamViec buoiLamViec;

    @NotNull(message = "Ngày làm việc không được để trống")
    private LocalDate ngayLamViec;
}
