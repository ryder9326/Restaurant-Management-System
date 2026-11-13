package restaurant.modules.hr.mapper;

import org.springframework.stereotype.Component;
import restaurant.modules.hr.dto.CaLamViecDTO;
import restaurant.modules.hr.dto.NhanVienRequestDTO;
import restaurant.modules.hr.dto.NhanVienResponseDTO;
import restaurant.modules.hr.entity.CaLamViec;
import restaurant.modules.hr.entity.NhanVien;

import java.util.Collections;
import java.util.stream.Collectors;

/**
 * Thành phần chuyển đổi dữ liệu hai chiều giữa các thực thể JPA ({@code NhanVien}, {@code CaLamViec})
 * và các đối tượng DTO trong phân hệ Nhân sự.
 * Kết nối với {@code NhanVienServiceImpl} nhằm tách biệt logic ánh xạ dữ liệu khỏi nghiệp vụ xử lý.
 */
@Component
public class NhanVienMapper {

    public NhanVien toEntity(NhanVienRequestDTO dto) {
        return NhanVien.builder()
                .maNV(dto.getMaNV())
                .hoVaTen(dto.getHoVaTen())
                .tuoi(dto.getTuoi())
                .chucVu(dto.getChucVu())
                .ngayBatDau(dto.getNgayBatDau())
                .trangThaiLamViec(dto.getTrangThaiLamViec())
                .username(dto.getUsername())
                .build();
    }

    public NhanVienResponseDTO toResponseDTO(NhanVien entity) {
        return NhanVienResponseDTO.builder()
                .maNV(entity.getMaNV())
                .hoVaTen(entity.getHoVaTen())
                .tuoi(entity.getTuoi())
                .chucVu(entity.getChucVu())
                .ngayBatDau(entity.getNgayBatDau())
                .trangThaiLamViec(entity.getTrangThaiLamViec())
                .username(entity.getUsername())
                .danhSachMaQuanLy(entity.getNguoiQuanLy() == null
                        ? Collections.emptySet()
                        : entity.getNguoiQuanLy().stream()
                        .map(NhanVien::getMaNV)
                        .collect(Collectors.toSet()))
                .build();
    }

    public CaLamViecDTO toCaLamViecDTO(CaLamViec entity) {
        return CaLamViecDTO.builder()
                .maNV(entity.getId().getMaNV())
                .tenNhanVien(entity.getNhanVien() != null ? entity.getNhanVien().getHoVaTen() : null)
                .buoiLamViec(entity.getId().getBuoiLamViec())
                .ngayLamViec(entity.getId().getNgayLamViec())
                .build();
    }
}
