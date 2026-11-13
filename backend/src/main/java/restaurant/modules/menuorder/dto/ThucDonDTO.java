package restaurant.modules.menuorder.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

/**
 * Đối tượng truyền tải dữ liệu quản lý thông tin món ăn trong thực đơn và danh sách mã nguyên liệu cấu thành.
 * Kết nối với thực thể {@code ThucDon} (cùng bảng liên kết {@code nguyenlieumonan}),
 * {@code MenuOrderMapper}, {@code MenuOrderServiceImpl} và {@code MenuOrderController}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThucDonDTO {

    @NotBlank(message = "Mã món ăn không được để trống")
    @Size(max = 20, message = "Mã món ăn tối đa 20 ký tự")
    private String maMon;

    @NotBlank(message = "Tên món ăn không được để trống")
    @Size(max = 100, message = "Tên món ăn tối đa 100 ký tự")
    private String tenMon;

    @Size(max = 500, message = "Mô tả món ăn tối đa 500 ký tự")
    private String moTa;

    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá bán phải lớn hơn 0")
    private BigDecimal giaBan;

    @Builder.Default
    private Set<String> maNguyenLieuList = new HashSet<>();
}