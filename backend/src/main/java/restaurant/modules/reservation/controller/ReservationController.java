package restaurant.modules.reservation.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import restaurant.common.response.ApiResponse;
import restaurant.common.response.PageResponse;
import restaurant.modules.reservation.dto.*;
import restaurant.modules.reservation.enums.TrangThaiBan;
import restaurant.modules.reservation.service.ReservationService;

import java.util.List;

/**
 * Bộ điều khiển REST API cung cấp các endpoint quản lý khách hàng, sơ đồ bàn ăn, đặt bàn trước
 * và thống kê lượt đặt bàn theo khu vực.
 * Kết nối trực tiếp với {@code ReservationService} để xử lý nghiệp vụ và tuân thủ luật phân quyền
 * {@code /reservations/**} trong {@code SecurityConfig}.
 */
@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping("/customers")
    public ResponseEntity<ApiResponse<KhachHangDTO>> registerCustomer(
            @Valid @RequestBody KhachHangDTO dto) {
        KhachHangDTO created = reservationService.registerCustomer(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Đăng ký thông tin khách hàng thành công"));
    }

    @GetMapping("/customers/by-phone")
    public ResponseEntity<ApiResponse<KhachHangDTO>> getCustomerByPhone(@RequestParam String sdt) {
        return ResponseEntity.ok(ApiResponse.success(reservationService.getCustomerByPhone(sdt)));
    }

    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<PageResponse<KhachHangDTO>>> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "maKH") String sortBy) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());
        return ResponseEntity.ok(ApiResponse.success(reservationService.getAllCustomers(pageable)));
    }

    @PostMapping("/tables")
    public ResponseEntity<ApiResponse<BanAnDTO>> createTable(@Valid @RequestBody BanAnDTO dto) {
        BanAnDTO created = reservationService.createTable(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Thêm mới bàn ăn thành công"));
    }

    @GetMapping("/tables/available")
    public ResponseEntity<ApiResponse<List<BanAnDTO>>> getAvailableTables(
            @RequestParam(required = false) String khuVuc) {
        return ResponseEntity.ok(ApiResponse.success(reservationService.getAvailableTablesByArea(khuVuc)));
    }

    @PatchMapping("/tables/{maBan}/status")
    public ResponseEntity<ApiResponse<BanAnDTO>> updateTableStatus(
            @PathVariable String maBan,
            @RequestParam TrangThaiBan status) {
        return ResponseEntity.ok(ApiResponse.success(
                reservationService.updateTableStatus(maBan, status),
                "Cập nhật trạng thái bàn ăn thành công"));
    }

    @PostMapping("/bookings")
    public ResponseEntity<ApiResponse<DatBanRequestDTO>> createReservation(
            @Valid @RequestBody DatBanRequestDTO dto) {
        DatBanRequestDTO created = reservationService.createReservation(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Đặt bàn thành công"));
    }

    @PostMapping("/seat")
    public ResponseEntity<ApiResponse<Void>> seatCustomerAtTable(
            @RequestParam String maKH,
            @RequestParam String maBan) {
        reservationService.seatCustomerAtTable(maKH, maBan);
        return ResponseEntity.ok(ApiResponse.success(null, "Xếp khách vào bàn thành công"));
    }

    @PostMapping("/tables/{maBan}/release")
    public ResponseEntity<ApiResponse<Void>> releaseTable(@PathVariable String maBan) {
        reservationService.releaseTable(maBan);
        return ResponseEntity.ok(ApiResponse.success(null, "Giải phóng bàn ăn thành công"));
    }

    @GetMapping("/bookings/details")
    public ResponseEntity<ApiResponse<List<ReservationDetailProjection>>> getReservationDetails() {
        return ResponseEntity.ok(ApiResponse.success(reservationService.getReservationDetails()));
    }

    @GetMapping("/stats/by-area")
    public ResponseEntity<ApiResponse<List<AreaReservationCountProjection>>> getReservationStatsByArea() {
        return ResponseEntity.ok(ApiResponse.success(reservationService.countReservationsByArea()));
    }
}
