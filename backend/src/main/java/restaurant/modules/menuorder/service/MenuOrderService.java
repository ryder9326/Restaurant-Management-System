package restaurant.modules.menuorder.service;

import org.springframework.data.domain.Pageable;
import restaurant.common.response.PageResponse;
import restaurant.modules.menuorder.dto.*;
import restaurant.modules.menuorder.enums.TrangThaiDatMon;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Giao diện định nghĩa các nghiệp vụ quản lý thực đơn, liên kết nguyên liệu món ăn,
 * ghi nhận gọi món, cập nhật tiến độ bếp và thống kê trạng thái món ăn theo ngày.
 * Kết nối {@code MenuOrderController} với lớp triển khai {@code MenuOrderServiceImpl}.
 */
public interface MenuOrderService {

    ThucDonDTO createMenuItem(ThucDonDTO dto);

    ThucDonDTO updateMenuItem(String maMon, ThucDonDTO dto);

    PageResponse<ThucDonDTO> getAllMenuItems(Pageable pageable);

    List<ThucDonDTO> searchMenuItemsByName(String keyword);

    DatMonResponseDTO placeDishOrder(DatMonRequestDTO dto);

    DatMonResponseDTO updateDishOrderStatus(
            String maKH,
            String maMon,
            LocalDateTime thoiGianGoi,
            TrangThaiDatMon newStatus
    );

    List<DishStatusStatProjection> getDishStatusStatsByDate(LocalDate date);

    List<CustomerDishOrderProjection> getCustomerOrdersByPhoneAndDate(String sdt, LocalDate date);
}
