package restaurant.modules.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import restaurant.modules.hr.entity.NhanVien;

import java.util.HashSet;
import java.util.Set;

/**
 * Thực thể ánh xạ bảng {@code cosovatchat} quản lý trang thiết bị, tài sản cố định của nhà hàng.
 * Kết nối với {@code NhanVien} (khóa ngoại {@code MaNV}) để xác định nhân viên chịu trách nhiệm
 * quản lý tài sản và ánh xạ quan hệ đa trị sang bảng {@code cungcapcsvc} để lưu danh sách nhà cung cấp.
 */
@Entity
@Table(name = "cosovatchat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoSoVatChat {

    @Id
    @Column(name = "MaTaiSan", length = 20, nullable = false)
    private String maTaiSan;

    @Column(name = "TenTaiSan", length = 100, nullable = false)
    private String tenTaiSan;

    @Column(name = "TinhTrang", length = 50, nullable = false)
    private String tinhTrang;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaNV")
    private NhanVien nhanVienQuanLy;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "cungcapcsvc",
            joinColumns = @JoinColumn(name = "MaTaiSan")
    )
    @Column(name = "TenNhaCungCap", length = 100, nullable = false)
    @Builder.Default
    private Set<String> nhaCungCap = new HashSet<>();
}
