package restaurant.modules.inventory.mapper;

import org.springframework.stereotype.Component;
import restaurant.modules.hr.entity.NhanVien;
import restaurant.modules.inventory.dto.CoSoVatChatDTO;
import restaurant.modules.inventory.dto.NguyenLieuDTO;
import restaurant.modules.inventory.entity.CoSoVatChat;
import restaurant.modules.inventory.entity.NguyenLieu;

import java.util.HashSet;

/**
 * Thành phần chuyển đổi dữ liệu hai chiều giữa các thực thể kho ({@code CoSoVatChat}, {@code NguyenLieu})
 * và các đối tượng DTO tương ứng.
 * Kết nối với {@code InventoryServiceImpl} để ánh xạ thông tin nhân viên quản lý và tập nhà cung cấp.
 */
@Component
public class InventoryMapper {

    public CoSoVatChat toEntity(CoSoVatChatDTO dto, NhanVien manager) {
        return CoSoVatChat.builder()
                .maTaiSan(dto.getMaTaiSan())
                .tenTaiSan(dto.getTenTaiSan())
                .tinhTrang(dto.getTinhTrang())
                .nhanVienQuanLy(manager)
                .nhaCungCap(dto.getDanhSachNhaCungCap() != null
                        ? new HashSet<>(dto.getDanhSachNhaCungCap())
                        : new HashSet<>())
                .build();
    }

    public CoSoVatChatDTO toDTO(CoSoVatChat entity) {
        return CoSoVatChatDTO.builder()
                .maTaiSan(entity.getMaTaiSan())
                .tenTaiSan(entity.getTenTaiSan())
                .tinhTrang(entity.getTinhTrang())
                .maNVQuanLy(entity.getNhanVienQuanLy() != null ? entity.getNhanVienQuanLy().getMaNV() : null)
                .tenNVQuanLy(entity.getNhanVienQuanLy() != null ? entity.getNhanVienQuanLy().getHoVaTen() : null)
                .danhSachNhaCungCap(entity.getNhaCungCap() != null
                        ? new HashSet<>(entity.getNhaCungCap())
                        : new HashSet<>())
                .build();
    }

    public NguyenLieu toEntity(NguyenLieuDTO dto, NhanVien manager) {
        return NguyenLieu.builder()
                .maNguyenLieu(dto.getMaNguyenLieu())
                .tenNguyenLieu(dto.getTenNguyenLieu())
                .donViTinh(dto.getDonViTinh())
                .luongTon(dto.getLuongTon())
                .hanSuDung(dto.getHanSuDung())
                .nhanVienQuanLy(manager)
                .nhaCungCap(dto.getDanhSachNhaCungCap() != null
                        ? new HashSet<>(dto.getDanhSachNhaCungCap())
                        : new HashSet<>())
                .build();
    }

    public NguyenLieuDTO toDTO(NguyenLieu entity) {
        return NguyenLieuDTO.builder()
                .maNguyenLieu(entity.getMaNguyenLieu())
                .tenNguyenLieu(entity.getTenNguyenLieu())
                .donViTinh(entity.getDonViTinh())
                .luongTon(entity.getLuongTon())
                .hanSuDung(entity.getHanSuDung())
                .maNVQuanLy(entity.getNhanVienQuanLy() != null ? entity.getNhanVienQuanLy().getMaNV() : null)
                .tenNVQuanLy(entity.getNhanVienQuanLy() != null ? entity.getNhanVienQuanLy().getHoVaTen() : null)
                .danhSachNhaCungCap(entity.getNhaCungCap() != null
                        ? new HashSet<>(entity.getNhaCungCap())
                        : new HashSet<>())
                .build();
    }
}
