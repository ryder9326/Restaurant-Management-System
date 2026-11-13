package restaurant.modules.hr.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import restaurant.common.exception.AppException;
import restaurant.common.exception.BusinessConflictException;
import restaurant.common.exception.ErrorCode;
import restaurant.common.exception.ResourceNotFoundException;
import restaurant.common.response.PageResponse;
import restaurant.common.security.CustomUserDetails;
import restaurant.modules.auth.enums.Role;
import restaurant.modules.hr.dto.ActiveTableServiceProjection;
import restaurant.modules.hr.dto.CaLamViecDTO;
import restaurant.modules.hr.dto.NhanVienRequestDTO;
import restaurant.modules.hr.dto.NhanVienResponseDTO;
import restaurant.modules.hr.entity.CaLamViec;
import restaurant.modules.hr.entity.NhanVien;
import restaurant.modules.hr.entity.id.CaLamViecId;
import restaurant.modules.hr.enums.TrangThaiLamViec;
import restaurant.modules.hr.mapper.NhanVienMapper;
import restaurant.modules.hr.repository.CaLamViecRepository;
import restaurant.modules.hr.repository.NhanVienRepository;
import restaurant.modules.hr.service.NhanVienService;
import restaurant.modules.reservation.entity.BanAn;
import restaurant.modules.reservation.entity.KhachHang;
import restaurant.modules.reservation.repository.BanAnRepository;
import restaurant.modules.reservation.repository.KhachHangRepository;

import java.time.LocalDate;
import java.util.List;

/**
 * Lớp triển khai toàn bộ nghiệp vụ của phân hệ Nhân sự & Ca làm việc.
 * Kết nối với {@code NhanVienRepository}, {@code CaLamViecRepository}, {@code BanAnRepository},
 * {@code KhachHangRepository}, {@code PasswordEncoder} và {@code SecurityContextHolder} để quản lý
 * vòng đời nhân viên, kiểm soát phân cấp quyền hạn chống leo thang đặc quyền, xếp ca và phân công bàn.
 */
@Service
@RequiredArgsConstructor
public class NhanVienServiceImpl implements NhanVienService {

    private final NhanVienRepository nhanVienRepository;
    private final CaLamViecRepository caLamViecRepository;
    private final BanAnRepository banAnRepository;
    private final KhachHangRepository khachHangRepository;
    private final NhanVienMapper nhanVienMapper;
    private final PasswordEncoder passwordEncoder;

    /**
     * Tạo mới hồ sơ nhân viên: kiểm tra phân cấp quyền hạn (chặn {@code ROLE_MANAGER} tạo tài khoản
     * có quyền {@code ROLE_ADMIN} hoặc {@code ROLE_MANAGER}), kiểm tra trùng mã/username và mã hóa mật khẩu.
     */
    @Override
    @Transactional
    public NhanVienResponseDTO createNhanVien(NhanVienRequestDTO dto) {
        enforceRoleHierarchyPermission(dto.getChucVu(), null);

        if (nhanVienRepository.existsById(dto.getMaNV())) {
            throw new BusinessConflictException("Mã nhân viên '" + dto.getMaNV() + "' đã tồn tại");
        }
        if (StringUtils.hasText(dto.getUsername()) && nhanVienRepository.existsByUsername(dto.getUsername())) {
            throw new BusinessConflictException("Tên đăng nhập '" + dto.getUsername() + "' đã được sử dụng");
        }

        NhanVien nhanVien = nhanVienMapper.toEntity(dto);
        if (StringUtils.hasText(dto.getPassword())) {
            nhanVien.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }

        NhanVien savedNhanVien = nhanVienRepository.save(nhanVien);
        if (StringUtils.hasText(dto.getMaNVQuanLy())) {
            assignManager(savedNhanVien.getMaNV(), dto.getMaNVQuanLy());
            savedNhanVien = nhanVienRepository.findById(savedNhanVien.getMaNV()).orElse(savedNhanVien);
        }

        return nhanVienMapper.toResponseDTO(savedNhanVien);
    }

    /**
     * Cập nhật hồ sơ nhân viên: xác minh người gọi có quyền chỉnh sửa nhân viên mục tiêu (ngăn chặn
     * {@code ROLE_MANAGER} can thiệp vào tài khoản {@code ROLE_ADMIN} hoặc tự nâng quyền lên {@code ADMIN}).
     */
    @Override
    @Transactional
    public NhanVienResponseDTO updateNhanVien(String maNV, NhanVienRequestDTO dto) {
        NhanVien existing = nhanVienRepository.findById(maNV)
                .orElseThrow(() -> new ResourceNotFoundException("NhanVien", "maNV", maNV));

        enforceRoleHierarchyPermission(dto.getChucVu(), existing.getChucVu());

        if (StringUtils.hasText(dto.getUsername())
                && !dto.getUsername().equals(existing.getUsername())
                && nhanVienRepository.existsByUsername(dto.getUsername())) {
            throw new BusinessConflictException("Tên đăng nhập '" + dto.getUsername() + "' đã được sử dụng");
        }

        existing.setHoVaTen(dto.getHoVaTen());
        existing.setTuoi(dto.getTuoi());
        existing.setChucVu(dto.getChucVu());
        existing.setNgayBatDau(dto.getNgayBatDau());
        existing.setTrangThaiLamViec(dto.getTrangThaiLamViec());
        if (StringUtils.hasText(dto.getUsername())) {
            existing.setUsername(dto.getUsername());
        }
        if (StringUtils.hasText(dto.getPassword())) {
            existing.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }

        NhanVien updated = nhanVienRepository.save(existing);
        return nhanVienMapper.toResponseDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public NhanVienResponseDTO getNhanVienById(String maNV) {
        NhanVien nhanVien = nhanVienRepository.findById(maNV)
                .orElseThrow(() -> new ResourceNotFoundException("NhanVien", "maNV", maNV));
        return nhanVienMapper.toResponseDTO(nhanVien);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NhanVienResponseDTO> getAllNhanVien(Pageable pageable) {
        Page<NhanVienResponseDTO> page = nhanVienRepository.findAll(pageable)
                .map(nhanVienMapper::toResponseDTO);
        return PageResponse.fromPage(page);
    }

    @Override
    @Transactional
    public void assignManager(String maNVBiQuanLy, String maNVQuanLy) {
        if (maNVBiQuanLy.equals(maNVQuanLy)) {
            throw new BusinessConflictException(ErrorCode.VALIDATION_ERROR, "Nhân viên không thể tự quản lý chính mình");
        }

        NhanVien subordinate = nhanVienRepository.findById(maNVBiQuanLy)
                .orElseThrow(() -> new ResourceNotFoundException("NhanVien", "maNV", maNVBiQuanLy));
        NhanVien manager = nhanVienRepository.findById(maNVQuanLy)
                .orElseThrow(() -> new ResourceNotFoundException("NhanVien", "maNV", maNVQuanLy));

        if (manager.getTrangThaiLamViec() != TrangThaiLamViec.DANG_LAM_VIEC) {
            throw new BusinessConflictException(
                    ErrorCode.UNAUTHORIZED_ACCESS,
                    "Nhân viên quản lý hiện không ở trạng thái đang làm việc"
            );
        }

        manager.getNhanVienCapDuoi().add(subordinate);
        nhanVienRepository.save(manager);
    }

    @Override
    @Transactional
    public CaLamViecDTO assignShift(CaLamViecDTO dto) {
        NhanVien nhanVien = nhanVienRepository.findById(dto.getMaNV())
                .orElseThrow(() -> new ResourceNotFoundException("NhanVien", "maNV", dto.getMaNV()));

        if (nhanVien.getTrangThaiLamViec() != TrangThaiLamViec.DANG_LAM_VIEC) {
            throw new BusinessConflictException(
                    ErrorCode.VALIDATION_ERROR,
                    "Chỉ có thể xếp ca cho nhân viên đang làm việc"
            );
        }

        CaLamViecId shiftId = new CaLamViecId(dto.getMaNV(), dto.getBuoiLamViec(), dto.getNgayLamViec());
        if (caLamViecRepository.existsById(shiftId)) {
            throw new BusinessConflictException("Nhân viên đã được phân công ca làm việc này");
        }

        CaLamViec caLamViec = CaLamViec.builder()
                .id(shiftId)
                .nhanVien(nhanVien)
                .build();

        CaLamViec savedShift = caLamViecRepository.save(caLamViec);
        return nhanVienMapper.toCaLamViecDTO(savedShift);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CaLamViecDTO> getShiftsByDate(LocalDate ngayLamViec) {
        return caLamViecRepository.findByIdNgayLamViec(ngayLamViec).stream()
                .map(nhanVienMapper::toCaLamViecDTO)
                .toList();
    }

    @Override
    @Transactional
    public void assignTableToWaiter(String maNV, String maBan) {
        NhanVien nhanVien = nhanVienRepository.findById(maNV)
                .orElseThrow(() -> new ResourceNotFoundException("NhanVien", "maNV", maNV));
        if (nhanVien.getTrangThaiLamViec() != TrangThaiLamViec.DANG_LAM_VIEC) {
            throw new BusinessConflictException(ErrorCode.VALIDATION_ERROR, "Nhân viên không ở trạng thái làm việc");
        }

        BanAn banAn = banAnRepository.findById(maBan)
                .orElseThrow(() -> new ResourceNotFoundException("BanAn", "maBan", maBan));

        nhanVien.getBanAnPhucVu().add(banAn);
        nhanVienRepository.save(nhanVien);
    }

    @Override
    @Transactional
    public void recordCustomerReception(String maNV, String maKH) {
        NhanVien nhanVien = nhanVienRepository.findById(maNV)
                .orElseThrow(() -> new ResourceNotFoundException("NhanVien", "maNV", maNV));
        KhachHang khachHang = khachHangRepository.findById(maKH)
                .orElseThrow(() -> new ResourceNotFoundException("KhachHang", "maKH", maKH));

        nhanVien.getKhachHangDonTiep().add(khachHang);
        nhanVienRepository.save(nhanVien);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActiveTableServiceProjection> getActiveServingStaffAndCustomers() {
        return nhanVienRepository.findActiveServingStaffAndCustomers();
    }

    /**
     * Kiểm tra phân cấp quyền hạn: nếu người thực hiện không phải {@code ROLE_ADMIN} thì tuyệt đối
     * không được phép gán chức vụ tương ứng với {@code ROLE_ADMIN}/{@code ROLE_MANAGER} hoặc
     * chỉnh sửa hồ sơ của nhân viên đang giữ quyền {@code ROLE_ADMIN}/{@code ROLE_MANAGER}.
     */
    private void enforceRoleHierarchyPermission(String targetNewChucVu, String existingChucVu) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isCallerAdmin = auth != null
                && auth.getPrincipal() instanceof CustomUserDetails userDetails
                && userDetails.getRole() == Role.ROLE_ADMIN;

        if (isCallerAdmin) {
            return;
        }

        if (isPrivilegedPosition(targetNewChucVu) || isPrivilegedPosition(existingChucVu)) {
            throw new AppException(
                    ErrorCode.UNAUTHORIZED_ACCESS,
                    "Chỉ Quản trị viên hệ thống (ADMIN) mới có quyền tạo hoặc cập nhật tài khoản Quản trị/Quản lý"
            );
        }
    }

    private boolean isPrivilegedPosition(String chucVu) {
        if (!StringUtils.hasText(chucVu)) {
            return false;
        }
        String normalized = chucVu.trim().toUpperCase();
        return normalized.equals("ADMIN")
                || normalized.equals("QUAN_TRI_VIEN")
                || normalized.equals("MANAGER")
                || normalized.equals("QUAN_LY");
    }
}