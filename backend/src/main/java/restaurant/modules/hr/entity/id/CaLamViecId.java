package restaurant.modules.hr.entity.id;


import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;
import restaurant.modules.hr.enums.BuoiLamViec;

import java.io.Serializable;
import java.time.LocalDate;

/**
 * Lớp khóa chính phức hợp (Embeddable ID) cho thực thể yếu {@code CaLamViec}.
 * Kết nối với {@code CaLamViec} thông qua annotation {@code @EmbeddedId} để định danh duy nhất
 * một ca trực dựa trên tổ hợp 3 thuộc tính: mã nhân viên, buổi làm việc và ngày làm việc.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class CaLamViecId implements Serializable {

    @Column(name = "MaNV", length = 20, nullable = false)
    private String maNV;

    @Enumerated(EnumType.STRING)
    @Column(name = "BuoiLamViec", length = 30, nullable = false)
    private BuoiLamViec buoiLamViec;

    @Column(name = "NgayLamViec", nullable = false)
    private LocalDate ngayLamViec;
}
