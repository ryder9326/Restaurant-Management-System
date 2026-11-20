package restaurant.modules.billing.converter;

import jakarta.persistence.Converter;
import restaurant.common.persistence.converter.AbstractEnumStringConverter;
import restaurant.modules.billing.enums.TrangThaiThanhToan;

import java.util.Map;

/** Persists payment statuses using the Vietnamese labels from {@code database/seed.sql}. */
@Converter
public class TrangThaiThanhToanConverter extends AbstractEnumStringConverter<TrangThaiThanhToan> {

    public TrangThaiThanhToanConverter() {
        super(Map.of(
                TrangThaiThanhToan.CHO_THANH_TOAN, "Chưa thanh toán",
                TrangThaiThanhToan.DA_THANH_TOAN, "Đã thanh toán",
                TrangThaiThanhToan.HOAN_TIEN, "Đã hoàn tiền",
                TrangThaiThanhToan.THAT_BAI, "Thất bại"
        ));
    }
}
