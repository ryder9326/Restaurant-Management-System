package restaurant.modules.menuorder.entity;

import jakarta.persistence.*;
import lombok.*;
import restaurant.modules.billing.entity.MonAnTrongHoaDon;
import restaurant.modules.inventory.entity.NguyenLieu;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

/**
 * Thực thể ánh xạ bảng {@code thucdon} lưu trữ danh mục món ăn, mô tả và đơn giá bán.
 * Kết nối với {@code NguyenLieu} qua bảng {@code nguyenlieumonan} để quản lý thành phần nguyên liệu,
 * đồng thời liên kết với {@code DatMon} và {@code MonAnTrongHoaDon} để ghi nhận gọi món và xuất hóa đơn.
 */
@Entity
@Table(name = "thucdon")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThucDon {

    @Id
    @Column(name = "MaMon", length = 20, nullable = false)
    private String maMon;

    @Column(name = "TenMon", length = 100, nullable = false)
    private String tenMon;

    @Column(name = "MoTa", length = 500)
    private String moTa;

    @Column(name = "GiaBan", precision = 15, scale = 2, nullable = false)
    private BigDecimal giaBan;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "nguyenlieumonan",
            joinColumns = @JoinColumn(name = "MaMon"),
            inverseJoinColumns = @JoinColumn(name = "MaNguyenLieu")
    )
    @Builder.Default
    private Set<NguyenLieu> danhSachNguyenLieu = new HashSet<>();

    @OneToMany(mappedBy = "thucDon", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<DatMon> danhSachDatMon = new HashSet<>();

    @OneToMany(mappedBy = "thucDon", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<MonAnTrongHoaDon> danhSachHoaDonChuaMon = new HashSet<>();
}