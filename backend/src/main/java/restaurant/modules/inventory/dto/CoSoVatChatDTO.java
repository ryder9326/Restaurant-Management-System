package restaurant.modules.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

/**
 * Đối tượng truyền tải dữ liệu quản lý trang thiết bị, tài sản cố định của nhà hàng.
 * Kết nối với thực thể {@code CoSoVatChat} (cùng bảng đa trị {@code cungcapcsvc}),
 * {@code InventoryMapper}, {@code InventoryServiceImpl} và {@code InventoryController}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoSoVatChatDTO {

    @NotBlank(message = "Mã tài sản không được để trống")
    @Size(max = 20, message = "Mã tài sản tối đa 20 ký tự")
    private String maTaiSan;

    @NotBlank(message = "Tên tài sản không được để trống")
    @Size(max = 100, message = "Tên tài sản tối đa 100 ký tự")
    private String tenTaiSan;

    @NotBlank(message = "Tình trạng tài sản không được để trống")
    @Size(max = 50, message = "Tình trạng tối đa 50 ký tự")
    private String tinhTrang;

    private String maNVQuanLy;
    private String tenNVQuanLy;

    @Builder.Default
    private Set<String> danhSachNhaCungCap = new HashSet<>();
}