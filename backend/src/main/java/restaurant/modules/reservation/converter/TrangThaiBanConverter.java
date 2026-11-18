package restaurant.modules.reservation.converter;

import jakarta.persistence.Converter;
import restaurant.common.persistence.converter.AbstractEnumStringConverter;
import restaurant.modules.reservation.enums.TrangThaiBan;

import java.util.Map;

/** Persists table statuses using the Vietnamese labels from {@code database/seed.sql}. */
@Converter
public class TrangThaiBanConverter extends AbstractEnumStringConverter<TrangThaiBan> {

    public TrangThaiBanConverter() {
        super(Map.of(
                TrangThaiBan.TRONG, "Trống",
                TrangThaiBan.DA_DAT_TRUOC, "Đã đặt",
                TrangThaiBan.DANG_PHUC_VU, "Đang sử dụng",
                TrangThaiBan.BAO_TRI, "Đang bảo trì"
        ));
    }
}
