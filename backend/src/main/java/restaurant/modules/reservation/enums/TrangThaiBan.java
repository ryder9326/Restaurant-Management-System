package restaurant.modules.reservation.enums;

/**
 * Biểu diễn trạng thái sử dụng thực tế của từng bàn ăn tại nhà hàng.
 * Kết nối với thực thể {@code BanAn} (cột {@code TrangThaiSuDung}) và {@code ReservationServiceImpl}
 * để kiểm tra điều kiện bàn trống khi nhận đặt bàn, xếp khách ngồi hoặc giải phóng bàn sau thanh toán.
 */
public enum TrangThaiBan {
    TRONG,
    DA_DAT_TRUOC,
    DANG_PHUC_VU,
    BAO_TRI
}
