package restaurant.modules.hr.converter;

import jakarta.persistence.Converter;
import restaurant.common.persistence.converter.AbstractEnumStringConverter;
import restaurant.modules.hr.enums.TrangThaiLamViec;

import java.util.Map;

/** Persists employee work statuses using the Vietnamese labels from {@code database/seed.sql}. */
@Converter
public class TrangThaiLamViecConverter extends AbstractEnumStringConverter<TrangThaiLamViec> {

    public TrangThaiLamViecConverter() {
        super(Map.of(
                TrangThaiLamViec.DANG_LAM_VIEC, "Đang làm",
                TrangThaiLamViec.NGHI_PHEP, "Nghỉ phép",
                TrangThaiLamViec.DA_NGHI_VIEC, "Đã nghỉ việc"
        ));
    }
}
