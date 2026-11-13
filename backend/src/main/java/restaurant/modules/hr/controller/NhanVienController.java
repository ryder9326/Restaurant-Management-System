package restaurant.modules.hr.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import restaurant.common.response.ApiResponse;
import restaurant.common.response.PageResponse;
import restaurant.modules.hr.dto.ActiveTableServiceProjection;
import restaurant.modules.hr.dto.CaLamViecDTO;
import restaurant.modules.hr.dto.NhanVienRequestDTO;
import restaurant.modules.hr.dto.NhanVienResponseDTO;
import restaurant.modules.hr.service.NhanVienService;

import java.time.LocalDate;
import java.util.List;

/**
 * Bộ điều khiển REST API cung cấp các endpoint quản lý nhân sự, phân cấp quản lý, lịch làm việc
 * và phân công phục vụ bàn/đón tiếp khách.
 * Kết nối trực tiếp với {@code NhanVienService} để xử lý nghiệp vụ và tuân thủ luật phân quyền
 * {@code /hr/**} trong {@code SecurityConfig}.
 */
@RestController
@RequestMapping("/hr")
@RequiredArgsConstructor
public class NhanVienController {

    private final NhanVienService nhanVienService;

    @PostMapping("/employees")
    public ResponseEntity<ApiResponse<NhanVienResponseDTO>> createNhanVien(
            @Valid @RequestBody NhanVienRequestDTO dto) {
        NhanVienResponseDTO created = nhanVienService.createNhanVien(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Thêm mới nhân viên thành công"));
    }

    @PutMapping("/employees/{maNV}")
    public ResponseEntity<ApiResponse<NhanVienResponseDTO>> updateNhanVien(
            @PathVariable String maNV,
            @Valid @RequestBody NhanVienRequestDTO dto) {
        NhanVienResponseDTO updated = nhanVienService.updateNhanVien(maNV, dto);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật thông tin nhân viên thành công"));
    }

    @GetMapping("/employees/{maNV}")
    public ResponseEntity<ApiResponse<NhanVienResponseDTO>> getNhanVienById(@PathVariable String maNV) {
        return ResponseEntity.ok(ApiResponse.success(nhanVienService.getNhanVienById(maNV)));
    }

    @GetMapping("/employees")
    public ResponseEntity<ApiResponse<PageResponse<NhanVienResponseDTO>>> getAllNhanVien(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "maNV") String sortBy) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());
        return ResponseEntity.ok(ApiResponse.success(nhanVienService.getAllNhanVien(pageable)));
    }

    @PostMapping("/employees/{maNV}/manager/{managerId}")
    public ResponseEntity<ApiResponse<Void>> assignManager(
            @PathVariable String maNV,
            @PathVariable String managerId) {
        nhanVienService.assignManager(maNV, managerId);
        return ResponseEntity.ok(ApiResponse.success(null, "Gán người quản lý thành công"));
    }

    @PostMapping("/shifts")
    public ResponseEntity<ApiResponse<CaLamViecDTO>> assignShift(@Valid @RequestBody CaLamViecDTO dto) {
        CaLamViecDTO createdShift = nhanVienService.assignShift(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(createdShift, "Phân công ca làm việc thành công"));
    }

    @GetMapping("/shifts")
    public ResponseEntity<ApiResponse<List<CaLamViecDTO>>> getShiftsByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(nhanVienService.getShiftsByDate(date)));
    }

    @PostMapping("/employees/{maNV}/serve-table/{maBan}")
    public ResponseEntity<ApiResponse<Void>> assignTableToWaiter(
            @PathVariable String maNV,
            @PathVariable String maBan) {
        nhanVienService.assignTableToWaiter(maNV, maBan);
        return ResponseEntity.ok(ApiResponse.success(null, "Phân công phục vụ bàn thành công"));
    }

    @PostMapping("/employees/{maNV}/receive-customer/{maKH}")
    public ResponseEntity<ApiResponse<Void>> recordCustomerReception(
            @PathVariable String maNV,
            @PathVariable String maKH) {
        nhanVienService.recordCustomerReception(maNV, maKH);
        return ResponseEntity.ok(ApiResponse.success(null, "Ghi nhận đón tiếp khách hàng thành công"));
    }

    @GetMapping("/serving-status")
    public ResponseEntity<ApiResponse<List<ActiveTableServiceProjection>>> getActiveServingStaff() {
        return ResponseEntity.ok(ApiResponse.success(nhanVienService.getActiveServingStaffAndCustomers()));
    }
}
