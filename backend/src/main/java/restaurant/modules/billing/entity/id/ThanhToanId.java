package restaurant.modules.billing.entity.id;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

/**
 * Lớp khóa chính phức hợp (Embeddable ID) cho thực thể giao dịch {@code ThanhToan}.
 * Kết nối với {@code ThanhToan} để gắn kết cặp định danh khách hàng thanh toán và hóa đơn
 * thông qua tổ hợp {@code (MaKH, MaHD)}.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ThanhToanId implements Serializable {

    @Column(name = "MaKH", length = 20, nullable = false)
    private String maKH;

    @Column(name = "MaHD", length = 20, nullable = false)
    private String maHD;
}