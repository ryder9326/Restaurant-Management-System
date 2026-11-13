package restaurant.modules.menuorder.entity;

import jakarta.persistence.*;
import lombok.*;
import restaurant.modules.menuorder.entity.id.DatMonId;
import restaurant.modules.menuorder.enums.TrangThaiDatMon;
import restaurant.modules.reservation.entity.KhachHang;

/**
 * Thực thể ánh xạ bảng {@code datmon} lưu chi tiết từng lượt gọi món của khách hàng theo thời gian thực.
 * Kết nối với {@code DatMonId}, {@code KhachHang} và {@code ThucDon} để theo dõi số lượng,
 * ghi chú chế biến và vòng đời trạng thái món ăn (chờ chế biến, đang làm, đã phục vụ, đã hủy).
 */
@Entity
@Table(name = "datmon")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatMon {

    @EmbeddedId
    private DatMonId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maKH")
    @JoinColumn(name = "MaKH", nullable = false)
    private KhachHang khachHang;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maMon")
    @JoinColumn(name = "MaMon", nullable = false)
    private ThucDon thucDon;

    @Column(name = "SoLuong", nullable = false)
    private Integer soLuong;

    @Enumerated(EnumType.STRING)
    @Column(name = "TrangThai", length = 30, nullable = false)
    private TrangThaiDatMon trangThai;

    @Column(name = "GhiChu", length = 255)
    private String ghiChu;
}
