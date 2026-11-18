package restaurant.modules.reservation.entity;

import jakarta.persistence.*;
import lombok.*;
import restaurant.modules.billing.entity.HoaDon;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Thực thể ánh xạ bảng {@code datban} lưu thông tin phiếu đặt bàn trước của khách hàng.
 * Kết nối với {@code KhachHang} (quan hệ Đặt trước), {@code BanAn} (quan hệ Thuộc bàn)
 * và {@code HoaDon} thông qua bảng trung gian {@code bantronghoadon} phục vụ thống kê doanh thu theo khu vực.
 */
@Entity
@Table(name = "datban")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatBan {

    @Id
    @Column(name = "MaDatBan", length = 20, nullable = false)
    private String maDatBan;

    @Column(name = "ThoiGianDat")
    private LocalDateTime thoiGianDat;

    @Column(name = "SoLuongKhach")
    private Integer soLuongKhach;

    @Column(name = "GhiChu", columnDefinition = "TEXT")
    private String ghiChu;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "dattruoc",
            joinColumns = @JoinColumn(name = "MaDatBan"),
            inverseJoinColumns = @JoinColumn(name = "MaKH")
    )
    @Builder.Default
    private Set<KhachHang> danhSachKhachHang = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaBan")
    private BanAn banAn;

    @ManyToMany(mappedBy = "danhSachDatBan", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<HoaDon> danhSachHoaDon = new HashSet<>();
}
