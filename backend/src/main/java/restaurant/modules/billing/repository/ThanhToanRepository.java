package restaurant.modules.billing.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import restaurant.modules.billing.dto.PaymentDetailProjection;
import restaurant.modules.billing.entity.ThanhToan;
import restaurant.modules.billing.entity.id.ThanhToanId;
import restaurant.modules.billing.enums.TrangThaiThanhToan;

import java.util.List;

/**
 * Giao diện truy xuất dữ liệu giao dịch thanh toán từ bảng {@code thanhtoan} (khóa phức hợp {@code ThanhToanId}).
 * Kết nối với {@code BillingAndAnalyticsServiceImpl} để kiểm tra trạng thái tất toán của hóa đơn
 * và truy vấn danh sách chi tiết thanh toán của khách hàng theo yêu cầu báo cáo.
 */
@Repository
public interface ThanhToanRepository extends JpaRepository<ThanhToan, ThanhToanId> {

    boolean existsByHoaDon_MaHDAndTrangThai(String maHD, TrangThaiThanhToan trangThai);

    @Query(value = """
        SELECT kh.HoVaTen AS tenKhachHang,
               hd.MaHD AS maHD,
               hd.TongTien AS tongTien,
               tt.GiamGia AS giamGia,
               tt.PhuongThuc AS phuongThuc,
               tt.TrangThai AS trangThaiThanhToan
        FROM thanhtoan tt
        JOIN khachhang kh ON tt.MaKH = kh.MaKH
        JOIN hoadon hd ON tt.MaHD = hd.MaHD
    """, nativeQuery = true)
    List<PaymentDetailProjection> findAllCustomerPaymentDetails();
}
