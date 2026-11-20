package restaurant.modules.reservation.entity;

import jakarta.persistence.*;
import lombok.*;
import restaurant.modules.hr.entity.NhanVien;
import restaurant.modules.reservation.enums.TrangThaiBan;

import java.util.HashSet;
import java.util.Set;

/**
 * Thực thể ánh xạ bảng {@code banan} quản lý sơ đồ bàn ăn, khu vực phục vụ, sức chứa và trạng thái hiện tại.
 * Kết nối với {@code DatBan} để quản lý lịch đặt trước, {@code KhachHang} (qua bảng {@code ngoi})
 * và {@code NhanVien} (qua bảng {@code phucvu}) phục vụ việc kiểm soát bàn trống và phân công phục vụ.
 */
@Entity
@Table(name = "banan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BanAn {

    @Id
    @Column(name = "MaBan", length = 20, nullable = false)
    private String maBan;

    @Column(name = "KhuVuc", length = 50)
    private String khuVuc;

    @Column(name = "SucChua")
    private Integer sucChua;

    @Convert(converter = restaurant.modules.reservation.converter.TrangThaiBanConverter.class)
    @Column(name = "TrangThaiSuDung", length = 50)
    private TrangThaiBan trangThaiSuDung;

    @OneToMany(mappedBy = "banAn", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<DatBan> danhSachDatBan = new HashSet<>();

    @ManyToMany(mappedBy = "banDangNgoi", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<KhachHang> khachHangDangNgoi = new HashSet<>();

    @ManyToMany(mappedBy = "banAnPhucVu", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<NhanVien> nhanVienPhucVu = new HashSet<>();
}
