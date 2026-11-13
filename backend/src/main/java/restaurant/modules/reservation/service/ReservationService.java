package restaurant.modules.reservation.service;

import org.springframework.data.domain.Pageable;
import restaurant.common.response.PageResponse;
import restaurant.modules.reservation.dto.*;
import restaurant.modules.reservation.enums.TrangThaiBan;

import java.util.List;

/**
 * Giao diện định nghĩa các nghiệp vụ quản lý khách hàng, sơ đồ bàn ăn, đặt bàn trước,
 * xếp chỗ ngồi thực tế và thống kê lượt đặt bàn theo khu vực.
 * Kết nối {@code ReservationController} với lớp triển khai {@code ReservationServiceImpl}.
 */
public interface ReservationService {

    KhachHangDTO registerCustomer(KhachHangDTO dto);

    KhachHangDTO getCustomerByPhone(String sdt);

    PageResponse<KhachHangDTO> getAllCustomers(Pageable pageable);

    BanAnDTO createTable(BanAnDTO dto);

    List<BanAnDTO> getAvailableTablesByArea(String khuVuc);

    BanAnDTO updateTableStatus(String maBan, TrangThaiBan status);

    DatBanRequestDTO createReservation(DatBanRequestDTO dto);

    void seatCustomerAtTable(String maKH, String maBan);

    void releaseTable(String maBan);

    List<ReservationDetailProjection> getReservationDetails();

    List<AreaReservationCountProjection> countReservationsByArea();
}
