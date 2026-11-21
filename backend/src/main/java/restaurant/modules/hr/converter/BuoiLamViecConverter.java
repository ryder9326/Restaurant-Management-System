package restaurant.modules.hr.converter;

import jakarta.persistence.Converter;
import restaurant.common.persistence.converter.AbstractEnumStringConverter;
import restaurant.modules.hr.enums.BuoiLamViec;

import java.util.Map;

/** Persists work shifts using the Vietnamese labels from {@code database/seed.sql}. */
@Converter
public class BuoiLamViecConverter extends AbstractEnumStringConverter<BuoiLamViec> {

    public BuoiLamViecConverter() {
        super(Map.of(
                BuoiLamViec.CA_SANG, "Ca Sáng",
                BuoiLamViec.CA_CHIEU, "Ca Chiều",
                BuoiLamViec.CA_TOI, "Ca Tối",
                BuoiLamViec.CA_NGAY, "Cả Ngày"
        ));
    }
}
