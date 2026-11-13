package restaurant.modules.reservation.mapper;

import org.springframework.stereotype.Component;
import restaurant.modules.reservation.dto.BanAnDTO;
import restaurant.modules.reservation.dto.DatBanRequestDTO;
import restaurant.modules.reservation.dto.KhachHangDTO;
import restaurant.modules.reservation.entity.BanAn;
import restaurant.modules.reservation.entity.DatBan;
import restaurant.modules.reservation.entity.KhachHang;

/**
 * Thành phần chuyển đổi dữ liệu hai chiều giữa các thực thể ({@code KhachHang}, {@code BanAn}, {@code DatBan})
 * và các đối tượng DTO trong phân hệ Đặt bàn.
 * Kết nối với {@code ReservationServiceImpl} để tách biệt logic ánh xạ dữ liệu khỏi quy trình nghiệp vụ.
 */
@Component
public class ReservationMapper {

    public KhachHang toEntity(KhachHangDTO dto) {
        return KhachHang.builder()
                .maKH(dto.getMaKH())
                .hoVaTen(dto.getHoVaTen())
                .sdt(dto.getSdt())
                .ghiChu(dto.getGhiChu())
                .build();
    }

    public KhachHangDTO toDTO(KhachHang entity) {
        return KhachHangDTO.builder()
                .maKH(entity.getMaKH())
                .hoVaTen(entity.getHoVaTen())
                .sdt(entity.getSdt())
                .ghiChu(entity.getGhiChu())
                .build();
    }

    public BanAn toEntity(BanAnDTO dto) {
        return BanAn.builder()
                .maBan(dto.getMaBan())
                .khuVuc(dto.getKhuVuc())
                .sucChua(dto.getSucChua())
                .trangThaiSuDung(dto.getTrangThaiSuDung())
                .build();
    }

    public BanAnDTO toDTO(BanAn entity) {
        return BanAnDTO.builder()
                .maBan(entity.getMaBan())
                .khuVuc(entity.getKhuVuc())
                .sucChua(entity.getSucChua())
                .trangThaiSuDung(entity.getTrangThaiSuDung())
                .build();
    }

    public DatBanRequestDTO toDTO(DatBan entity) {
        return DatBanRequestDTO.builder()
                .maDatBan(entity.getMaDatBan())
                .maKH(entity.getKhachHang().getMaKH())
                .maBan(entity.getBanAn().getMaBan())
                .thoiGianDat(entity.getThoiGianDat())
                .soLuongKhach(entity.getSoLuongKhach())
                .ghiChu(entity.getGhiChu())
                .build();
    }
}