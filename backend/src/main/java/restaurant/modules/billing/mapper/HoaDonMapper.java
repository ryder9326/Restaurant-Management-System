package restaurant.modules.billing.mapper;

import org.springframework.stereotype.Component;
import restaurant.modules.billing.dto.GiamGiaDTO;
import restaurant.modules.billing.dto.HoaDonResponseDTO;
import restaurant.modules.billing.dto.ThanhToanResponseDTO;
import restaurant.modules.billing.entity.GiamGia;
import restaurant.modules.billing.entity.HoaDon;
import restaurant.modules.billing.entity.MonAnTrongHoaDon;
import restaurant.modules.billing.entity.ThanhToan;
import restaurant.modules.reservation.entity.DatBan;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Thành phần chuyển đổi dữ liệu hai chiều giữa các thực thể tài chính ({@code HoaDon}, {@code GiamGia},
 * {@code ThanhToan}) và các đối tượng DTO trong phân hệ Hóa đơn & Thanh toán.
 * Kết nối với {@code BillingAndAnalyticsServiceImpl} để tách biệt logic ánh xạ dữ liệu khỏi nghiệp vụ tính tiền.
 */
@Component
public class HoaDonMapper {

    public GiamGia toEntity(GiamGiaDTO dto) {
        return GiamGia.builder()
                .maGiamGia(dto.getMaGiamGia())
                .giaTriUuDai(dto.getGiaTriUuDai())
                .dieuKienApDung(dto.getDieuKienApDung())
                .thoiHan(dto.getThoiHan())
                .build();
    }

    public GiamGiaDTO toDTO(GiamGia entity) {
        return GiamGiaDTO.builder()
                .maGiamGia(entity.getMaGiamGia())
                .giaTriUuDai(entity.getGiaTriUuDai())
                .dieuKienApDung(entity.getDieuKienApDung())
                .thoiHan(entity.getThoiHan())
                .build();
    }

    public HoaDonResponseDTO toHoaDonResponseDTO(HoaDon entity) {
        List<HoaDonResponseDTO.ChiTietMonHoaDonDTO> items = entity.getChiTietMonAn() == null
                ? Collections.emptyList()
                : entity.getChiTietMonAn().stream()
                .map(this::toChiTietMonDTO)
                .toList();

        return HoaDonResponseDTO.builder()
                .maHD(entity.getMaHD())
                .tongTien(entity.getTongTien())
                .danhSachMaDatBan(entity.getDanhSachDatBan() == null
                        ? Collections.emptySet()
                        : entity.getDanhSachDatBan().stream()
                        .map(DatBan::getMaDatBan)
                        .collect(Collectors.toSet()))
                .danhSachMaGiamGia(entity.getDanhSachGiamGia() == null
                        ? Collections.emptySet()
                        : entity.getDanhSachGiamGia().stream()
                        .map(GiamGia::getMaGiamGia)
                        .collect(Collectors.toSet()))
                .chiTietMonAn(items)
                .build();
    }

    private HoaDonResponseDTO.ChiTietMonHoaDonDTO toChiTietMonDTO(MonAnTrongHoaDon item) {
        BigDecimal donGia = item.getDonGiaLucBan() != null
                ? item.getDonGiaLucBan()
                : item.getThucDon().getGiaBan();
        BigDecimal thanhTien = donGia.multiply(BigDecimal.valueOf(item.getSoLuong()));

        return HoaDonResponseDTO.ChiTietMonHoaDonDTO.builder()
                .maMon(item.getThucDon().getMaMon())
                .tenMon(item.getThucDon().getTenMon())
                .donGia(donGia)
                .soLuong(item.getSoLuong())
                .thanhTien(thanhTien)
                .build();
    }

    public ThanhToanResponseDTO toThanhToanResponseDTO(ThanhToan entity) {
        return ThanhToanResponseDTO.builder()
                .maKH(entity.getKhachHang().getMaKH())
                .tenKhachHang(entity.getKhachHang().getHoVaTen())
                .maHD(entity.getHoaDon().getMaHD())
                .tongTienThanhToan(entity.getHoaDon().getTongTien())
                .tongTienGiamGia(entity.getGiamGia())
                .phuongThuc(entity.getPhuongThuc())
                .trangThai(entity.getTrangThai())
                .build();
    }
}
