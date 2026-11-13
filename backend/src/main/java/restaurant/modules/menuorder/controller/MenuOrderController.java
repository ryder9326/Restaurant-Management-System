package restaurant.modules.menuorder.controller;

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
import restaurant.modules.menuorder.dto.*;
import restaurant.modules.menuorder.enums.TrangThaiDatMon;
import restaurant.modules.menuorder.service.MenuOrderService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Bộ điều khiển REST API cung cấp các endpoint quản lý thực đơn món ăn, tiếp nhận gọi món,
 * cập nhật trạng thái chế biến và truy vấn thống kê món ăn theo ngày hoặc số điện thoại khách hàng.
 * Kết nối trực tiếp với {@code MenuOrderService} để xử lý nghiệp vụ và tuân thủ luật phân quyền
 * {@code /menu-orders/**} trong {@code SecurityConfig}.
 */
@RestController
@RequestMapping("/menu-orders")
@RequiredArgsConstructor
public class MenuOrderController {

    private final MenuOrderService menuOrderService;

    @PostMapping("/menu")
    public ResponseEntity<ApiResponse<ThucDonDTO>> createMenuItem(@Valid @RequestBody ThucDonDTO dto) {
        ThucDonDTO created = menuOrderService.createMenuItem(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Thêm món ăn vào thực đơn thành công"));
    }

    @PutMapping("/menu/{maMon}")
    public ResponseEntity<ApiResponse<ThucDonDTO>> updateMenuItem(
            @PathVariable String maMon,
            @Valid @RequestBody ThucDonDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(
                menuOrderService.updateMenuItem(maMon, dto),
                "Cập nhật thông tin món ăn thành công"));
    }

    @GetMapping("/menu")
    public ResponseEntity<ApiResponse<PageResponse<ThucDonDTO>>> getAllMenuItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "maMon") String sortBy) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());
        return ResponseEntity.ok(ApiResponse.success(menuOrderService.getAllMenuItems(pageable)));
    }

    @GetMapping("/menu/search")
    public ResponseEntity<ApiResponse<List<ThucDonDTO>>> searchMenuItems(@RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.success(menuOrderService.searchMenuItemsByName(keyword)));
    }

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<DatMonResponseDTO>> placeDishOrder(
            @Valid @RequestBody DatMonRequestDTO dto) {
        DatMonResponseDTO created = menuOrderService.placeDishOrder(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Gọi món thành công"));
    }

    @PatchMapping("/orders/status")
    public ResponseEntity<ApiResponse<DatMonResponseDTO>> updateDishOrderStatus(
            @RequestParam String maKH,
            @RequestParam String maMon,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime thoiGianGoi,
            @RequestParam TrangThaiDatMon status) {
        DatMonResponseDTO updated = menuOrderService.updateDishOrderStatus(maKH, maMon, thoiGianGoi, status);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật trạng thái món ăn thành công"));
    }

    @GetMapping("/orders/stats/by-date")
    public ResponseEntity<ApiResponse<List<DishStatusStatProjection>>> getDishStatusStatsByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(menuOrderService.getDishStatusStatsByDate(date)));
    }

    @GetMapping("/orders/by-customer-phone")
    public ResponseEntity<ApiResponse<List<CustomerDishOrderProjection>>> getCustomerOrdersByPhoneAndDate(
            @RequestParam String sdt,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(
                menuOrderService.getCustomerOrdersByPhoneAndDate(sdt, date)));
    }
}
