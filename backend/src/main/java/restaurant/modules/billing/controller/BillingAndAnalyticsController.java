package restaurant.modules.billing.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import restaurant.common.response.ApiResponse;
import restaurant.modules.billing.dto.*;
import restaurant.modules.billing.service.BillingAndAnalyticsService;

import java.util.List;

/**
 * Bộ điều khiển REST API cung cấp các endpoint quản lý mã giảm giá, lập hóa đơn, thanh toán
 * và truy xuất các báo cáo thống kê kinh doanh của nhà hàng.
 * Kết nối trực tiếp với {@code BillingAndAnalyticsService} để xử lý nghiệp vụ và tuân thủ luật phân quyền
 * {@code /billing/**} trong {@code SecurityConfig}.
 */
@RestController
@RequestMapping("/billing")
@RequiredArgsConstructor
public class BillingAndAnalyticsController {

    private final BillingAndAnalyticsService billingService;

    @PostMapping("/discounts")
    public ResponseEntity<ApiResponse<GiamGiaDTO>> createDiscount(@Valid @RequestBody GiamGiaDTO dto) {
        GiamGiaDTO created = billingService.createDiscount(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Tạo mã giảm giá thành công"));
    }

    @GetMapping("/discounts/active")
    public ResponseEntity<ApiResponse<List<GiamGiaDTO>>> getActiveDiscounts() {
        return ResponseEntity.ok(ApiResponse.success(billingService.getActiveDiscounts()));
    }

    @PostMapping("/invoices")
    public ResponseEntity<ApiResponse<HoaDonResponseDTO>> createInvoice(
            @Valid @RequestBody HoaDonRequestDTO dto) {
        HoaDonResponseDTO created = billingService.createInvoice(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Lập hóa đơn thành công"));
    }

    @GetMapping("/invoices/{maHD}")
    public ResponseEntity<ApiResponse<HoaDonResponseDTO>> getInvoiceDetail(@PathVariable String maHD) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getInvoiceDetail(maHD)));
    }

    @PostMapping("/payments")
    public ResponseEntity<ApiResponse<ThanhToanResponseDTO>> processPayment(
            @Valid @RequestBody ThanhToanRequestDTO dto) {
        ThanhToanResponseDTO receipt = billingService.processPayment(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(receipt, "Thanh toán hóa đơn thành công"));
    }

    @GetMapping("/payments/details")
    public ResponseEntity<ApiResponse<List<PaymentDetailProjection>>> getAllPaymentDetails() {
        return ResponseEntity.ok(ApiResponse.success(billingService.getAllPaymentDetails()));
    }

    @GetMapping("/analytics/best-selling-dishes")
    public ResponseEntity<ApiResponse<List<BestSellingDishProjection>>> getBestSellingDishes() {
        return ResponseEntity.ok(ApiResponse.success(billingService.getBestSellingDishes()));
    }

    @GetMapping("/analytics/revenue-by-area")
    public ResponseEntity<ApiResponse<List<AreaRevenueStatProjection>>> getRevenueStatsByArea() {
        return ResponseEntity.ok(ApiResponse.success(billingService.getRevenueStatsByArea()));
    }

    @GetMapping("/analytics/customer-discounts")
    public ResponseEntity<ApiResponse<List<InvoiceDiscountCountProjection>>> getDiscountCountByCustomerName(
            @RequestParam String customerName) {
        return ResponseEntity.ok(ApiResponse.success(
                billingService.getDiscountCountByCustomerName(customerName)));
    }
}
