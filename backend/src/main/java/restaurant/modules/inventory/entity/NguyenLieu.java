package restaurant.modules.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import restaurant.modules.hr.entity.NhanVien;
import restaurant.modules.menuorder.entity.ThucDon;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * Thực thể ánh xạ bảng {@code nguyenlieu} quản lý tồn kho, đơn vị tính và hạn sử dụng thực phẩm.
 * Kết nối với {@code NhanVien} (người quản lý kho), bảng {@code cungcapnl} (danh sách nhà cung cấp)
 * và thực thể {@code ThucDon} qua bảng trung gian {@code nguyenlieumonan} để truy vấn định lượng món ăn.
 */
@Entity
@Table(name = "nguyenlieu")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NguyenLieu {

    @Id
    @Column(name = "MaNguyenLieu", length = 20, nullable = false)
    private String maNguyenLieu;

    @Column(name = "TenNguyenLieu", length = 100, nullable = false)
    private String tenNguyenLieu;

    @Column(name = "DonViTinh", length = 30, nullable = false)
    private String donViTinh;

    @Column(name = "LuongTon", precision = 12, scale = 3, nullable = false)
    private BigDecimal luongTon;

    @Column(name = "HanSuDung")
    private LocalDate hanSuDung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaNV")
    private NhanVien nhanVienQuanLy;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "cungcapnl",
            joinColumns = @JoinColumn(name = "MaNguyenLieu")
    )
    @Column(name = "TenNhaCungCap", length = 100, nullable = false)
    @Builder.Default
    private Set<String> nhaCungCap = new HashSet<>();

    @ManyToMany(mappedBy = "danhSachNguyenLieu", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<ThucDon> cacMonSuDung = new HashSet<>();
}
