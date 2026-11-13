package restaurant.modules.hr.entity;

import jakarta.persistence.*;
import lombok.*;
import restaurant.modules.hr.enums.TrangThaiLamViec;
import restaurant.modules.inventory.entity.CoSoVatChat;
import restaurant.modules.inventory.entity.NguyenLieu;
import restaurant.modules.reservation.entity.BanAn;
import restaurant.modules.reservation.entity.KhachHang;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * Thực thể ánh xạ bảng {@code nhanvien} lưu trữ hồ sơ nhân sự và tài khoản đăng nhập hệ thống.
 * Kết nối với {@code CustomUserDetailsService} để xác thực bảo mật, tự liên kết đệ quy qua bảng
 * {@code quanlynv} để phân cấp quản lý, và liên kết với {@code CaLamViec}, {@code CoSoVatChat},
 * {@code NguyenLieu}, {@code KhachHang} (bảng {@code dontiep}), {@code BanAn} (bảng {@code phucvu}).
 */
@Entity
@Table(name = "nhanvien")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NhanVien {

    @Id
    @Column(name = "MaNV", length = 20, nullable = false)
    private String maNV;

    @Column(name = "HoVaTen", length = 100, nullable = false)
    private String hoVaTen;

    @Column(name = "Tuoi")
    private Integer tuoi;

    @Column(name = "ChucVu", length = 50, nullable = false)
    private String chucVu;

    @Column(name = "NgayBatDau")
    private LocalDate ngayBatDau;

    @Enumerated(EnumType.STRING)
    @Column(name = "TrangThaiLamViec", length = 30, nullable = false)
    private TrangThaiLamViec trangThaiLamViec;

    @Column(name = "Username", length = 50, unique = true)
    private String username;

    @Column(name = "PasswordHash", length = 255)
    private String passwordHash;

    @OneToMany(mappedBy = "nhanVien", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<CaLamViec> danhSachCaLamViec = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "quanlynv",
            joinColumns = @JoinColumn(name = "MaNVQuanLy"),
            inverseJoinColumns = @JoinColumn(name = "MaNVBiQuanLy")
    )
    @Builder.Default
    private Set<NhanVien> nhanVienCapDuoi = new HashSet<>();

    @ManyToMany(mappedBy = "nhanVienCapDuoi", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<NhanVien> nguoiQuanLy = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "dontiep",
            joinColumns = @JoinColumn(name = "MaNV"),
            inverseJoinColumns = @JoinColumn(name = "MaKH")
    )
    @Builder.Default
    private Set<KhachHang> khachHangDonTiep = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "phucvu",
            joinColumns = @JoinColumn(name = "MaNV"),
            inverseJoinColumns = @JoinColumn(name = "MaBan")
    )
    @Builder.Default
    private Set<BanAn> banAnPhucVu = new HashSet<>();

    @OneToMany(mappedBy = "nhanVienQuanLy", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<CoSoVatChat> coSoVatChatQuanLy = new HashSet<>();

    @OneToMany(mappedBy = "nhanVienQuanLy", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<NguyenLieu> nguyenLieuQuanLy = new HashSet<>();
}