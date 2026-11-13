package restaurant.modules.inventory.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * Đối tượng truyền tải dữ liệu quản lý nguyên liệu kho, định lượng tồn và hạn sử dụng.
 * Kết nối với thực thể {@code NguyenLieu} (cùng bảng đa trị {@code cungcapnl}),
 * {@code InventoryMapper}, {@code InventoryServiceImpl} và {@code InventoryController}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NguyenLieuDTO {

    @NotBlank(message = "Mã nguyên liệu không được để trống")
    @Size(max = 20, message = "Mã nguyên liệu tối đa 20 ký tự")
    private String maNguyenLieu;

    @NotBlank(message = "Tên nguyên liệu không được để trống")
    @Size(max = 100, message = "Tên nguyên liệu tối đa 100 ký tự")
    private String tenNguyenLieu;

    @NotBlank(message = "Đơn vị tính không được để trống")
    @Size(max = 30, message = "Đơn vị tính tối đa 30 ký tự")
    private String donViTinh;

    @NotNull(message = "Lượng tồn không được để trống")
    @DecimalMin(value = "0.0", message = "Lượng tồn không được nhỏ hơn 0")
    private BigDecimal luongTon;

    private LocalDate hanSuDung;
    private String maNVQuanLy;
    private String tenNVQuanLy;

    @Builder.Default
    private Set<String> danhSachNhaCungCap = new HashSet<>();
}
