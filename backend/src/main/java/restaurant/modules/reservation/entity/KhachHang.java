package restaurant.modules.reservation.entity;

import jakarta.persistence.*;
import lombok.*;
import restaurant.modules.billing.entity.GiamGia;
import restaurant.modules.billing.entity.ThanhToan;
import restaurant.modules.hr.entity.NhanVien;
import restaurant.modules.menuorder.entity.DatMon;

import java.util.HashSet;
import java.util.Set;

/**
 * Thực thể ánh xạ bảng {@code khachhang} lưu trữ thông tin định danh và liên hệ của khách hàng.
 * Kết nối với {@code DatBan}, {@code BanAn} (qua bảng {@code ngoi}), {@code NhanVien} (bảng {@code dontiep}),
 * {@code DatMon}, {@code GiamGia} (bảng {@code sudunggiamgia}) và {@code ThanhToan} để theo dõi
 * toàn bộ hành trình của khách từ lúc đặt bàn đến khi thanh toán.
 */
@Entity
@Table(name = "khachhang")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KhachHang {

    @Id
    @Column(name = "MaKH", length = 20, nullable = false)
    private String maKH;

    @Column(name = "HoVaTen", length = 100, nullable = false)
    private String hoVaTen;

    @Column(name = "SDT", length = 15, nullable = false)
    private String sdt;

    @Column(name = "GhiChu", length = 255)
    private String ghiChu;

    @OneToMany(mappedBy = "khachHang", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<DatBan> danhSachDatBan = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "ngoi",
            joinColumns = @JoinColumn(name = "MaKH"),
            inverseJoinColumns = @JoinColumn(name = "MaBan")
    )
    @Builder.Default
    private Set<BanAn> banDangNgoi = new HashSet<>();

    @ManyToMany(mappedBy = "khachHangDonTiep", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<NhanVien> nhanVienDonTiep = new HashSet<>();

    @OneToMany(mappedBy = "khachHang", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<DatMon> lichSuDatMon = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "sudunggiamgia",
            joinColumns = @JoinColumn(name = "MaKH"),
            inverseJoinColumns = @JoinColumn(name = "MaGiamGia")
    )
    @Builder.Default
    private Set<GiamGia> maGiamGiaDaDung = new HashSet<>();

    @OneToMany(mappedBy = "khachHang", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<ThanhToan> lichSuThanhToan = new HashSet<>();
}
