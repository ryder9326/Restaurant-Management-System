package restaurant.modules.hr.dto;

import lombok.*;
import restaurant.modules.hr.enums.TrangThaiLamViec;

import java.time.LocalDate;
import java.util.Set;

/**
 * Đối tượng đóng gói thông tin hồ sơ nhân viên trả về cho Client qua REST API.
 * Kết nối với {@code NhanVienMapper}, {@code NhanVienServiceImpl} và {@code NhanVienController}
 * nhằm che giấu trường {@code passwordHash} của thực thể {@code NhanVien} và hiển thị danh sách
 * mã người quản lý trực tiếp.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NhanVienResponseDTO {

    private String maNV;
    private String hoVaTen;
    private Integer tuoi;
    private String chucVu;
    private LocalDate ngayBatDau;
    private TrangThaiLamViec trangThaiLamViec;
    private String username;
    private Set<String> danhSachMaQuanLy;
}