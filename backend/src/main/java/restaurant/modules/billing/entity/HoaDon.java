package restaurant.modules.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import restaurant.modules.reservation.entity.DatBan;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

/**
 * Thực thể ánh xạ bảng {@code hoadon} lưu trữ thông tin hóa đơn và tổng giá trị thanh toán.
 * Kết nối với {@code DatBan} qua bảng {@code bantronghoadon}, {@code GiamGia} qua bảng
 * {@code magiamgiahoadon}, {@code MonAnTrongHoaDon} để chi tiết hóa từng món ăn và {@code ThanhToan}.
 */
@Entity
@Table(name = "hoadon")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoaDon {

    @Id
    @Column(name = "MaHD", length = 20, nullable = false)
    private String maHD;

    @Column(name = "TongTien", precision = 15, scale = 2, nullable = false)
    private BigDecimal tongTien;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "bantronghoadon",
            joinColumns = @JoinColumn(name = "MaHD"),
            inverseJoinColumns = @JoinColumn(name = "MaDatBan")
    )
    @Builder.Default
    private Set<DatBan> danhSachDatBan = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "magiamgiahoadon",
            joinColumns = @JoinColumn(name = "MaHD"),
            inverseJoinColumns = @JoinColumn(name = "MaGiamGia")
    )
    @Builder.Default
    private Set<GiamGia> danhSachGiamGia = new HashSet<>();

    @OneToMany(mappedBy = "hoaDon", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<MonAnTrongHoaDon> chiTietMonAn = new HashSet<>();

    @OneToMany(mappedBy = "hoaDon", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<ThanhToan> danhSachThanhToan = new HashSet<>();
}
