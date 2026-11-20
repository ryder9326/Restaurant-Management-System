package restaurant.modules.menuorder.converter;

import jakarta.persistence.Converter;
import restaurant.common.persistence.converter.AbstractEnumStringConverter;
import restaurant.modules.menuorder.enums.TrangThaiDatMon;

import java.util.Map;

/** Persists dish order statuses using the Vietnamese labels from {@code database/seed.sql}. */
@Converter
public class TrangThaiDatMonConverter extends AbstractEnumStringConverter<TrangThaiDatMon> {

    public TrangThaiDatMonConverter() {
        super(Map.of(
                TrangThaiDatMon.CHO_CHE_BIEN, "Chờ chế biến",
                TrangThaiDatMon.DANG_CHE_BIEN, "Đang chế biến",
                TrangThaiDatMon.DA_PHUC_VU, "Đã phục vụ",
                TrangThaiDatMon.DA_HUY, "Đã hủy"
        ));
    }
}
