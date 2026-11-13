package restaurant.modules.billing.service;

import restaurant.modules.billing.dto.*;

import java.util.List;

/**
 * Giao diện định nghĩa các nghiệp vụ quản lý chương trình giảm giá, lập hóa đơn,
 * xử lý giao dịch thanh toán và truy xuất các báo cáo thống kê doanh thu nhà hàng.
 * Kết nối {@code BillingAndAnalyticsController} với lớp triển khai {@code BillingAndAnalyticsServiceImpl}.
 */
public interface BillingAndAnalyticsService {

    GiamGiaDTO createDiscount(GiamGiaDTO dto);

    List<GiamGiaDTO> getActiveDiscounts();

    HoaDonResponseDTO createInvoice(HoaDonRequestDTO dto);

    HoaDonResponseDTO getInvoiceDetail(String maHD);

    ThanhToanResponseDTO processPayment(ThanhToanRequestDTO dto);

    List<BestSellingDishProjection> getBestSellingDishes();

    List<AreaRevenueStatProjection> getRevenueStatsByArea();

    List<InvoiceDiscountCountProjection> getDiscountCountByCustomerName(String hoVaTen);

    List<PaymentDetailProjection> getAllPaymentDetails();
}
