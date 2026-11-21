package restaurant.modules.menuorder.mapper;

import org.springframework.stereotype.Component;
import restaurant.modules.inventory.entity.NguyenLieu;
import restaurant.modules.menuorder.dto.DatMonResponseDTO;
import restaurant.modules.menuorder.dto.ThucDonDTO;
import restaurant.modules.menuorder.entity.DatMon;
import restaurant.modules.menuorder.entity.ThucDon;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Thành phần chuyển đổi dữ liệu hai chiều giữa các thực thể ({@code ThucDon}, {@code DatMon})
 * và các đối tượng DTO trong phân hệ Thực đơn & Gọi món.
 * Kết nối với {@code MenuOrderServiceImpl} để tách biệt logic ánh xạ khỏi quy trình xử lý gọi món.
 */
@Component
public class MenuOrderMapper {

    public ThucDon toEntity(ThucDonDTO dto, Set<NguyenLieu> ingredients) {
        return ThucDon.builder()
                .maMon(dto.getMaMon())
                .tenMon(dto.getTenMon())
                .moTa(dto.getMoTa())
                .giaBan(dto.getGiaBan())
                .trangThaiMon(dto.getTrangThaiMon() == null ? "Đang bán" : dto.getTrangThaiMon())
                .danhSachNguyenLieu(ingredients)
                .build();
    }

    public ThucDonDTO toDTO(ThucDon entity) {
        return ThucDonDTO.builder()
                .maMon(entity.getMaMon())
                .tenMon(entity.getTenMon())
                .moTa(entity.getMoTa())
                .giaBan(entity.getGiaBan())
                .trangThaiMon(entity.getTrangThaiMon())
                .maNguyenLieuList(entity.getDanhSachNguyenLieu() == null
                        ? Collections.emptySet()
                        : entity.getDanhSachNguyenLieu().stream()
                        .map(NguyenLieu::getMaNguyenLieu)
                        .collect(Collectors.toSet()))
                .build();
    }

    public DatMonResponseDTO toDatMonResponseDTO(DatMon entity) {
        BigDecimal unitPrice = entity.getThucDon().getGiaBan();
        BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(entity.getSoLuong()));

        String maBan = null;
        if (entity.getKhachHang() != null
                && entity.getKhachHang().getBanDangNgoi() != null
                && !entity.getKhachHang().getBanDangNgoi().isEmpty()) {
            maBan = entity.getKhachHang().getBanDangNgoi().iterator().next().getMaBan();
        }

        return DatMonResponseDTO.builder()
                .maKH(entity.getId().getMaKH())
                .tenKhachHang(entity.getKhachHang().getHoVaTen())
                .maBan(maBan)
                .maMon(entity.getId().getMaMon())
                .tenMon(entity.getThucDon().getTenMon())
                .thoiGianGoi(entity.getId().getThoiGianGoi())
                .soLuong(entity.getSoLuong())
                .trangThai(entity.getTrangThai())
                .ghiChu(entity.getGhiChu())
                .thanhTien(lineTotal)
                .build();
    }
}
