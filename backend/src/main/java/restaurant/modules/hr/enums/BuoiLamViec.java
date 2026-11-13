package restaurant.modules.hr.enums;

/**
 * Định nghĩa các khung ca làm việc trong ngày của nhân viên nhà hàng.
 * Kết nối với khóa phức hợp {@code CaLamViecId} và thực thể {@code CaLamViec} để phân công
 * lịch trực theo từng buổi cụ thể trong ngày.
 */
public enum BuoiLamViec {
    CA_SANG,
    CA_CHIEU,
    CA_TOI,
    CA_GAY
}