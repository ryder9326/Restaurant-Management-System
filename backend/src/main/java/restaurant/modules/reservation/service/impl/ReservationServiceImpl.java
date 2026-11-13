package restaurant.modules.reservation.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import restaurant.common.exception.BusinessConflictException;
import restaurant.common.exception.ErrorCode;
import restaurant.common.exception.ResourceNotFoundException;
import restaurant.common.response.PageResponse;
import restaurant.modules.reservation.dto.*;
import restaurant.modules.reservation.entity.BanAn;
import restaurant.modules.reservation.entity.DatBan;
import restaurant.modules.reservation.entity.KhachHang;
import restaurant.modules.reservation.enums.TrangThaiBan;
import restaurant.modules.reservation.mapper.ReservationMapper;
import restaurant.modules.reservation.repository.BanAnRepository;
import restaurant.modules.reservation.repository.DatBanRepository;
import restaurant.modules.reservation.repository.KhachHangRepository;
import restaurant.modules.reservation.service.ReservationService;

import java.util.HashSet;
import java.util.List;

/**
 * Lớp triển khai toàn bộ nghiệp vụ của phân hệ Khách hàng, Bàn ăn & Đặt bàn.
 * Kết nối với {@code KhachHangRepository}, {@code BanAnRepository}, {@code DatBanRepository}
 * và {@code ReservationMapper} để quản lý hồ sơ khách hàng, kiểm tra sức chứa/khung giờ trống khi đặt bàn,
 * cập nhật quan hệ {@code ngoi} và điều phối trạng thái bàn ăn.
 */
@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private static final int RESERVATION_BUFFER_HOURS = 2;

    private final KhachHangRepository khachHangRepository;
    private final BanAnRepository banAnRepository;
    private final DatBanRepository datBanRepository;
    private final ReservationMapper reservationMapper;

    /**
     * Đăng ký mới thông tin khách hàng vào bảng {@code khachhang}; ngăn chặn trùng khóa chính
     * {@code MaKH} hoặc trùng số điện thoại {@code SDT} đã tồn tại trong hệ thống.
     */
    @Override
    @Transactional
    public KhachHangDTO registerCustomer(KhachHangDTO dto) {
        if (khachHangRepository.existsById(dto.getMaKH())) {
            throw new BusinessConflictException("Mã khách hàng '" + dto.getMaKH() + "' đã tồn tại");
        }
        if (khachHangRepository.existsBySdt(dto.getSdt())) {
            throw new BusinessConflictException("Số điện thoại '" + dto.getSdt() + "' đã được đăng ký");
        }

        KhachHang saved = khachHangRepository.save(reservationMapper.toEntity(dto));
        return reservationMapper.toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public KhachHangDTO getCustomerByPhone(String sdt) {
        KhachHang khachHang = khachHangRepository.findBySdt(sdt)
                .orElseThrow(() -> new ResourceNotFoundException("KhachHang", "sdt", sdt));
        return reservationMapper.toDTO(khachHang);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<KhachHangDTO> getAllCustomers(Pageable pageable) {
        Page<KhachHangDTO> page = khachHangRepository.findAll(pageable).map(reservationMapper::toDTO);
        return PageResponse.fromPage(page);
    }

    @Override
    @Transactional
    public BanAnDTO createTable(BanAnDTO dto) {
        if (banAnRepository.existsById(dto.getMaBan())) {
            throw new BusinessConflictException("Mã bàn '" + dto.getMaBan() + "' đã tồn tại");
        }
        BanAn saved = banAnRepository.save(reservationMapper.toEntity(dto));
        return reservationMapper.toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BanAnDTO> getAvailableTablesByArea(String khuVuc) {
        List<BanAn> tables = StringUtils.hasText(khuVuc)
                ? banAnRepository.findByKhuVucAndTrangThaiSuDung(khuVuc, TrangThaiBan.TRONG)
                : banAnRepository.findByTrangThaiSuDung(TrangThaiBan.TRONG);
        return tables.stream().map(reservationMapper::toDTO).toList();
    }

    @Override
    @Transactional
    public BanAnDTO updateTableStatus(String maBan, TrangThaiBan status) {
        BanAn banAn = banAnRepository.findById(maBan)
                .orElseThrow(() -> new ResourceNotFoundException("BanAn", "maBan", maBan));
        banAn.setTrangThaiSuDung(status);
        return reservationMapper.toDTO(banAnRepository.save(banAn));
    }

    /**
     * Khởi tạo phiếu đặt bàn trước ({@code DatBan}): kiểm tra bàn không ở trạng thái bảo trì,
     * đối chiếu số lượng khách không vượt quá sức chứa của bàn, kiểm tra không trùng lịch đặt
     * trong khoảng +/- 2 giờ và chuyển trạng thái bàn sang {@code DA_DAT_TRUOC} nếu bàn đang trống.
     */
    @Override
    @Transactional
    public DatBanRequestDTO createReservation(DatBanRequestDTO dto) {
        if (datBanRepository.existsById(dto.getMaDatBan())) {
            throw new BusinessConflictException("Mã đặt bàn '" + dto.getMaDatBan() + "' đã tồn tại");
        }

        KhachHang khachHang = khachHangRepository.findById(dto.getMaKH())
                .orElseThrow(() -> new ResourceNotFoundException("KhachHang", "maKH", dto.getMaKH()));
        BanAn banAn = banAnRepository.findById(dto.getMaBan())
                .orElseThrow(() -> new ResourceNotFoundException("BanAn", "maBan", dto.getMaBan()));

        if (banAn.getTrangThaiSuDung() == TrangThaiBan.BAO_TRI) {
            throw new BusinessConflictException(
                    ErrorCode.TABLE_NOT_AVAILABLE,
                    "Bàn '" + banAn.getMaBan() + "' hiện đang bảo trì, không thể đặt trước"
            );
        }

        if (dto.getSoLuongKhach() > banAn.getSucChua()) {
            throw new BusinessConflictException(
                    ErrorCode.TABLE_CAPACITY_EXCEEDED,
                    String.format("Số lượng khách (%d) vượt quá sức chứa tối đa (%d) của bàn %s",
                            dto.getSoLuongKhach(), banAn.getSucChua(), banAn.getMaBan())
            );
        }

        boolean isOverlapping = datBanRepository.existsOverlappingReservation(
                banAn.getMaBan(),
                dto.getThoiGianDat().minusHours(RESERVATION_BUFFER_HOURS),
                dto.getThoiGianDat().plusHours(RESERVATION_BUFFER_HOURS)
        );
        if (isOverlapping) {
            throw new BusinessConflictException(
                    ErrorCode.TABLE_NOT_AVAILABLE,
                    "Bàn '" + banAn.getMaBan() + "' đã có lịch đặt trong khung giờ này"
            );
        }

        DatBan datBan = DatBan.builder()
                .maDatBan(dto.getMaDatBan())
                .khachHang(khachHang)
                .banAn(banAn)
                .thoiGianDat(dto.getThoiGianDat())
                .soLuongKhach(dto.getSoLuongKhach())
                .ghiChu(dto.getGhiChu())
                .build();

        if (banAn.getTrangThaiSuDung() == TrangThaiBan.TRONG) {
            banAn.setTrangThaiSuDung(TrangThaiBan.DA_DAT_TRUOC);
            banAnRepository.save(banAn);
        }

        DatBan saved = datBanRepository.save(datBan);
        return reservationMapper.toDTO(saved);
    }

    /**
     * Xếp khách hàng vào ngồi bàn thực tế: xác minh bàn không đang bảo trì hoặc đang có nhóm khách khác
     * phục vụ, ghi nhận liên kết vào bảng trung gian {@code ngoi} và chuyển bàn sang {@code DANG_PHUC_VU}.
     */
    @Override
    @Transactional
    public void seatCustomerAtTable(String maKH, String maBan) {
        KhachHang khachHang = khachHangRepository.findById(maKH)
                .orElseThrow(() -> new ResourceNotFoundException("KhachHang", "maKH", maKH));
        BanAn banAn = banAnRepository.findById(maBan)
                .orElseThrow(() -> new ResourceNotFoundException("BanAn", "maBan", maBan));

        if (banAn.getTrangThaiSuDung() == TrangThaiBan.BAO_TRI
                || banAn.getTrangThaiSuDung() == TrangThaiBan.DANG_PHUC_VU) {
            throw new BusinessConflictException(
                    ErrorCode.TABLE_NOT_AVAILABLE,
                    "Bàn '" + maBan + "' hiện không sẵn sàng để xếp khách"
            );
        }

        khachHang.getBanDangNgoi().add(banAn);
        banAn.setTrangThaiSuDung(TrangThaiBan.DANG_PHUC_VU);

        khachHangRepository.save(khachHang);
        banAnRepository.save(banAn);
    }

    /**
     * Giải phóng bàn ăn sau khi khách dùng bữa xong: xóa toàn bộ liên kết khách ngồi tại bàn
     * trong bảng {@code ngoi} và đặt lại trạng thái bàn về {@code TRONG}.
     */
    @Override
    @Transactional
    public void releaseTable(String maBan) {
        BanAn banAn = banAnRepository.findById(maBan)
                .orElseThrow(() -> new ResourceNotFoundException("BanAn", "maBan", maBan));

        for (KhachHang khachHang : new HashSet<>(banAn.getKhachHangDangNgoi())) {
            khachHang.getBanDangNgoi().remove(banAn);
            khachHangRepository.save(khachHang);
        }

        banAn.setTrangThaiSuDung(TrangThaiBan.TRONG);
        banAnRepository.save(banAn);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationDetailProjection> getReservationDetails() {
        return datBanRepository.findAllReservationDetails();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AreaReservationCountProjection> countReservationsByArea() {
        return banAnRepository.countReservationsByArea();
    }
}
