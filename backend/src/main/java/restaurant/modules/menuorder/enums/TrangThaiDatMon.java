package restaurant.modules.menuorder.enums;

/**
 * Biểu diễn vòng đời xử lý của một món ăn từ lúc khách gọi tới khi phục vụ xong hoặc hủy.
 * Kết nối với thực thể {@code DatMon} (cột {@code TrangThai}) và {@code DatMonRepository}
 * để phục vụ chức năng cập nhật trạng thái bếp và thống kê món ăn phục vụ/hủy theo ngày.
 */
public enum TrangThaiDatMon {
    CHO_CHE_BIEN,
    DANG_CHE_BIEN,
    DA_PHUC_VU,
    DA_HUY
}