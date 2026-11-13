package restaurant.modules.menuorder.entity.id;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Lớp khóa chính phức hợp (Embeddable ID) cho thực thể liên kết {@code DatMon}.
 * Kết nối với {@code DatMon} để cho phép một khách hàng có thể gọi cùng một món ăn
 * nhiều lần tại các thời điểm khác nhau thông qua tổ hợp {@code (MaKH, MaMon, ThoiGianGoi)}.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class DatMonId implements Serializable {

    @Column(name = "MaKH", length = 20, nullable = false)
    private String maKH;

    @Column(name = "MaMon", length = 20, nullable = false)
    private String maMon;

    @Column(name = "ThoiGianGoi", nullable = false)
    private LocalDateTime thoiGianGoi;
}
