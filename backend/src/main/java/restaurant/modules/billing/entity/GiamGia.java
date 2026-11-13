package restaurant.modules.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import restaurant.modules.reservation.entity.KhachHang;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * Thực thể ánh xạ bảng {@code giamgia} quản lý các chương trình khuyến mãi, mức ưu đãi và thời hạn hiệu lực.
 * Kết nối với {@code HoaDon} (qua bảng {@code magiamgiahoadon}) và {@code KhachHang}
 * (qua bảng {@code sudunggiamgia}) để kiểm soát điều kiện áp dụng và lịch sử sử dụng mã giảm giá.
 */
@Entity
@Table(name = "giamgia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiamGia {

    @Id
    @Column(name = "MaGiamGia", length = 20, nullable = false)
    private String maGiamGia;

    @Column(name = "GiaTriUuDai", precision = 15, scale = 2, nullable = false)
    private BigDecimal giaTriUuDai;

    @Column(name = "DieuKienApDung", length = 255)
    private String dieuKienApDung;

    @Column(name = "ThoiHan", nullable = false)
    private LocalDate thoiHan;

    @ManyToMany(mappedBy = "danhSachGiamGia", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<HoaDon> hoaDonApDung = new HashSet<>();

    @ManyToMany(mappedBy = "maGiamGiaDaDung", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<KhachHang> khachHangSuDung = new HashSet<>();
}
