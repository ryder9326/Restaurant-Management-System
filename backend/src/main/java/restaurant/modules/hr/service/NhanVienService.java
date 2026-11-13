package restaurant.modules.hr.service;

import org.springframework.data.domain.Pageable;
import restaurant.common.response.PageResponse;
import restaurant.modules.hr.dto.ActiveTableServiceProjection;
import restaurant.modules.hr.dto.CaLamViecDTO;
import restaurant.modules.hr.dto.NhanVienRequestDTO;
import restaurant.modules.hr.dto.NhanVienResponseDTO;

import java.time.LocalDate;
import java.util.List;

/**
 * Giao diện định nghĩa các nghiệp vụ quản lý hồ sơ nhân sự, phân cấp quản lý, xếp ca làm việc,
 * phân công bàn phục vụ và ghi nhận đón tiếp khách hàng.
 * Kết nối {@code NhanVienController} với lớp triển khai {@code NhanVienServiceImpl}.
 */
public interface NhanVienService {

    NhanVienResponseDTO createNhanVien(NhanVienRequestDTO dto);

    NhanVienResponseDTO updateNhanVien(String maNV, NhanVienRequestDTO dto);

    NhanVienResponseDTO getNhanVienById(String maNV);

    PageResponse<NhanVienResponseDTO> getAllNhanVien(Pageable pageable);

    void assignManager(String maNVBiQuanLy, String maNVQuanLy);

    CaLamViecDTO assignShift(CaLamViecDTO dto);

    List<CaLamViecDTO> getShiftsByDate(LocalDate ngayLamViec);

    void assignTableToWaiter(String maNV, String maBan);

    void recordCustomerReception(String maNV, String maKH);

    List<ActiveTableServiceProjection> getActiveServingStaffAndCustomers();
}
