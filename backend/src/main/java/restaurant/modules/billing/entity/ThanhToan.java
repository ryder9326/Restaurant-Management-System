package restaurant.modules.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import restaurant.modules.billing.entity.id.ThanhToanId;
import restaurant.modules.billing.enums.PhuongThucThanhToan;
import restaurant.modules.billing.enums.TrangThaiThanhToan;
import restaurant.modules.reservation.entity.KhachHang;

import java.math.BigDecimal;

/**
 * Thực thể ánh xạ bảng {@code thanhtoan} ghi nhận giao dịch thanh toán hóa đơn của khách hàng.
 * Kết nối với {@code ThanhToanId}, {@code KhachHang} và {@code HoaDon} để lưu phương thức thanh toán,
 * số tiền được giảm giá thực tế và trạng thái hoàn tất của giao dịch.
 */
@Entity
@Table(name = "thanhtoan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThanhToan {

    @EmbeddedId
    private ThanhToanId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maKH")
    @JoinColumn(name = "MaKH", nullable = false)
    private KhachHang khachHang;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maHD")
    @JoinColumn(name = "MaHD", nullable = false)
    private HoaDon hoaDon;

    @Enumerated(EnumType.STRING)
    @Column(name = "PhuongThuc", length = 30, nullable = false)
    private PhuongThucThanhToan phuongThuc;

    @Column(name = "GiamGia", precision = 15, scale = 2, nullable = false)
    private BigDecimal giamGia;

    @Enumerated(EnumType.STRING)
    @Column(name = "TrangThai", length = 30, nullable = false)
    private TrangThaiThanhToan trangThai;
}