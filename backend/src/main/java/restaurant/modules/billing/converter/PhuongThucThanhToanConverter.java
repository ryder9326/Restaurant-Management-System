package restaurant.modules.billing.converter;

import jakarta.persistence.Converter;
import restaurant.common.persistence.converter.AbstractEnumStringConverter;
import restaurant.modules.billing.enums.PhuongThucThanhToan;

import java.util.Map;

/** Persists payment methods using the Vietnamese labels from {@code database/seed.sql}. */
@Converter
public class PhuongThucThanhToanConverter extends AbstractEnumStringConverter<PhuongThucThanhToan> {

    public PhuongThucThanhToanConverter() {
        super(Map.of(
                PhuongThucThanhToan.TIEN_MAT, "Tiền mặt",
                PhuongThucThanhToan.CHUYEN_KHOAN, "Chuyển khoản",
                PhuongThucThanhToan.THE_NGAN_HANG, "Thẻ tín dụng",
                PhuongThucThanhToan.VI_DIEN_TU, "Ví điện tử"
        ));
    }
}
