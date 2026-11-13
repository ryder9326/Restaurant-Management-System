package restaurant.modules.billing.entity.id;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

/**
 * Lớp khóa chính phức hợp (Embeddable ID) cho thực thể chi tiết hóa đơn {@code MonAnTrongHoaDon}.
 * Kết nối với {@code MonAnTrongHoaDon} thông qua cặp khóa ngoại {@code (MaHD, MaMon)}
 * nhằm định danh duy nhất từng dòng món ăn xuất hiện trong một hóa đơn.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class MonAnTrongHoaDonId implements Serializable {

    @Column(name = "MaHD", length = 20, nullable = false)
    private String maHD;

    @Column(name = "MaMon", length = 20, nullable = false)
    private String maMon;
}