package restaurant.modules.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import restaurant.modules.billing.entity.id.MonAnTrongHoaDonId;
import restaurant.modules.menuorder.entity.ThucDon;

import java.math.BigDecimal;

/**
 * Thực thể ánh xạ bảng trung gian {@code monantronghoadon} lưu số lượng và đơn giá tại thời điểm bán.
 * Kết nối với {@code MonAnTrongHoaDonId}, {@code HoaDon} và {@code ThucDon} để bảo toàn lịch sử giá
 * hóa đơn ngay cả khi thực đơn thay đổi giá về sau.
 */
@Entity
@Table(name = "monantronghoadon")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonAnTrongHoaDon {

    @EmbeddedId
    private MonAnTrongHoaDonId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maHD")
    @JoinColumn(name = "MaHD", nullable = false)
    private HoaDon hoaDon;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maMon")
    @JoinColumn(name = "MaMon", nullable = false)
    private ThucDon thucDon;

    @Column(name = "SoLuong", nullable = false)
    private Integer soLuong;

    @Column(name = "DonGiaLucBan", precision = 15, scale = 2)
    private BigDecimal donGiaLucBan;
}