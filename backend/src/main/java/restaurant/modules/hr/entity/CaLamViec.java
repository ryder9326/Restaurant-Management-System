package restaurant.modules.hr.entity;

import jakarta.persistence.*;
import lombok.*;
import restaurant.modules.hr.entity.id.CaLamViecId;

/**
 * Thực thể ánh xạ bảng {@code calamviec} quản lý lịch phân công ca trực của nhân viên theo ngày.
 * Kết nối với khóa phức hợp {@code CaLamViecId} và thực thể {@code NhanVien} thông qua {@code @MapsId}
 * để đồng bộ khóa ngoại {@code MaNV} với thành phần định danh của ca làm việc.
 */
@Entity
@Table(name = "calamviec")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaLamViec {

    @EmbeddedId
    private CaLamViecId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maNV")
    @JoinColumn(name = "MaNV", nullable = false)
    private NhanVien nhanVien;
}