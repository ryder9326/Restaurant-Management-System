-- =================================================================================
-- Script khởi tạo cấu trúc CSDL Quản lý Nhà hàng (Flyway Migration V1).
-- Ánh xạ đầy đủ các quan hệ trong báo cáo với tầng JPA Entity, tích hợp cột
-- DonGiaLucBan trong bảng monantronghoadon (P2-4) và ràng buộc UNIQUE (MaHD)
-- trong bảng thanhtoan (P1-3) để chống ghi trùng giao dịch thanh toán đồng thời.
-- =================================================================================

CREATE TABLE IF NOT EXISTS nhanvien (
    MaNV VARCHAR(20) NOT NULL,
    HoVaTen VARCHAR(100) NOT NULL,
    Tuoi INT,
    ChucVu VARCHAR(50) NOT NULL,
    NgayBatDau DATE,
    TrangThaiLamViec VARCHAR(30) NOT NULL,
    Username VARCHAR(50) UNIQUE,
    PasswordHash VARCHAR(255),
    PRIMARY KEY (MaNV)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quanlynv (
    MaNVQuanLy VARCHAR(20) NOT NULL,
    MaNVBiQuanLy VARCHAR(20) NOT NULL,
    PRIMARY KEY (MaNVQuanLy, MaNVBiQuanLy),
    CONSTRAINT fk_quanlynv_manager FOREIGN KEY (MaNVQuanLy) REFERENCES nhanvien (MaNV) ON DELETE CASCADE,
    CONSTRAINT fk_quanlynv_subordinate FOREIGN KEY (MaNVBiQuanLy) REFERENCES nhanvien (MaNV) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS calamviec (
    MaNV VARCHAR(20) NOT NULL,
    BuoiLamViec VARCHAR(30) NOT NULL,
    NgayLamViec DATE NOT NULL,
    PRIMARY KEY (MaNV, BuoiLamViec, NgayLamViec),
    CONSTRAINT fk_calamviec_nv FOREIGN KEY (MaNV) REFERENCES nhanvien (MaNV) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cosovatchat (
    MaTaiSan VARCHAR(20) NOT NULL,
    TenTaiSan VARCHAR(100) NOT NULL,
    TinhTrang VARCHAR(50) NOT NULL,
    MaNV VARCHAR(20),
    PRIMARY KEY (MaTaiSan),
    CONSTRAINT fk_csvc_nv FOREIGN KEY (MaNV) REFERENCES nhanvien (MaNV) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cungcapcsvc (
    MaTaiSan VARCHAR(20) NOT NULL,
    TenNhaCungCap VARCHAR(100) NOT NULL,
    PRIMARY KEY (MaTaiSan, TenNhaCungCap),
    CONSTRAINT fk_cungcapcsvc_taisan FOREIGN KEY (MaTaiSan) REFERENCES cosovatchat (MaTaiSan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nguyenlieu (
    MaNguyenLieu VARCHAR(20) NOT NULL,
    TenNguyenLieu VARCHAR(100) NOT NULL,
    DonViTinh VARCHAR(30) NOT NULL,
    LuongTon DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
    HanSuDung DATE,
    MaNV VARCHAR(20),
    PRIMARY KEY (MaNguyenLieu),
    CONSTRAINT chk_nguyenlieu_luongton CHECK (LuongTon >= 0),
    CONSTRAINT fk_nguyenlieu_nv FOREIGN KEY (MaNV) REFERENCES nhanvien (MaNV) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cungcapnl (
    MaNguyenLieu VARCHAR(20) NOT NULL,
    TenNhaCungCap VARCHAR(100) NOT NULL,
    PRIMARY KEY (MaNguyenLieu, TenNhaCungCap),
    CONSTRAINT fk_cungcapnl_nl FOREIGN KEY (MaNguyenLieu) REFERENCES nguyenlieu (MaNguyenLieu) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS khachhang (
    MaKH VARCHAR(20) NOT NULL,
    HoVaTen VARCHAR(100) NOT NULL,
    SDT VARCHAR(15) NOT NULL UNIQUE,
    GhiChu VARCHAR(255),
    PRIMARY KEY (MaKH)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS banan (
    MaBan VARCHAR(20) NOT NULL,
    KhuVuc VARCHAR(50) NOT NULL,
    SucChua INT NOT NULL,
    TrangThaiSuDung VARCHAR(30) NOT NULL,
    PRIMARY KEY (MaBan),
    CONSTRAINT chk_banan_succhua CHECK (SucChua >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS datban (
    MaDatBan VARCHAR(20) NOT NULL,
    ThoiGianDat DATETIME NOT NULL,
    SoLuongKhach INT NOT NULL,
    GhiChu VARCHAR(255),
    MaKH VARCHAR(20) NOT NULL,
    MaBan VARCHAR(20) NOT NULL,
    PRIMARY KEY (MaDatBan),
    INDEX idx_datban_ban_thoigian (MaBan, ThoiGianDat),
    CONSTRAINT fk_datban_kh FOREIGN KEY (MaKH) REFERENCES khachhang (MaKH) ON DELETE CASCADE,
    CONSTRAINT fk_datban_ban FOREIGN KEY (MaBan) REFERENCES banan (MaBan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dontiep (
    MaNV VARCHAR(20) NOT NULL,
    MaKH VARCHAR(20) NOT NULL,
    PRIMARY KEY (MaNV, MaKH),
    CONSTRAINT fk_dontiep_nv FOREIGN KEY (MaNV) REFERENCES nhanvien (MaNV) ON DELETE CASCADE,
    CONSTRAINT fk_dontiep_kh FOREIGN KEY (MaKH) REFERENCES khachhang (MaKH) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ngoi (
    MaKH VARCHAR(20) NOT NULL,
    MaBan VARCHAR(20) NOT NULL,
    PRIMARY KEY (MaKH, MaBan),
    CONSTRAINT fk_ngoi_kh FOREIGN KEY (MaKH) REFERENCES khachhang (MaKH) ON DELETE CASCADE,
    CONSTRAINT fk_ngoi_ban FOREIGN KEY (MaBan) REFERENCES banan (MaBan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS phucvu (
    MaNV VARCHAR(20) NOT NULL,
    MaBan VARCHAR(20) NOT NULL,
    PRIMARY KEY (MaNV, MaBan),
    CONSTRAINT fk_phucvu_nv FOREIGN KEY (MaNV) REFERENCES nhanvien (MaNV) ON DELETE CASCADE,
    CONSTRAINT fk_phucvu_ban FOREIGN KEY (MaBan) REFERENCES banan (MaBan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS thucdon (
    MaMon VARCHAR(20) NOT NULL,
    TenMon VARCHAR(100) NOT NULL,
    MoTa VARCHAR(500),
    GiaBan DECIMAL(15, 2) NOT NULL,
    PRIMARY KEY (MaMon),
    CONSTRAINT chk_thucdon_giaban CHECK (GiaBan > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nguyenlieumonan (
    MaMon VARCHAR(20) NOT NULL,
    MaNguyenLieu VARCHAR(20) NOT NULL,
    PRIMARY KEY (MaMon, MaNguyenLieu),
    CONSTRAINT fk_nlma_mon FOREIGN KEY (MaMon) REFERENCES thucdon (MaMon) ON DELETE CASCADE,
    CONSTRAINT fk_nlma_nl FOREIGN KEY (MaNguyenLieu) REFERENCES nguyenlieu (MaNguyenLieu) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS datmon (
    MaKH VARCHAR(20) NOT NULL,
    MaMon VARCHAR(20) NOT NULL,
    ThoiGianGoi DATETIME NOT NULL,
    SoLuong INT NOT NULL,
    TrangThai VARCHAR(30) NOT NULL,
    GhiChu VARCHAR(255),
    PRIMARY KEY (MaKH, MaMon, ThoiGianGoi),
    INDEX idx_datmon_thoigiangoi (ThoiGianGoi),
    CONSTRAINT fk_datmon_kh FOREIGN KEY (MaKH) REFERENCES khachhang (MaKH) ON DELETE CASCADE,
    CONSTRAINT fk_datmon_mon FOREIGN KEY (MaMon) REFERENCES thucdon (MaMon) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hoadon (
    MaHD VARCHAR(20) NOT NULL,
    TongTien DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (MaHD)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bantronghoadon (
    MaHD VARCHAR(20) NOT NULL,
    MaDatBan VARCHAR(20) NOT NULL,
    PRIMARY KEY (MaHD, MaDatBan),
    CONSTRAINT fk_bthd_hd FOREIGN KEY (MaHD) REFERENCES hoadon (MaHD) ON DELETE CASCADE,
    CONSTRAINT fk_bthd_db FOREIGN KEY (MaDatBan) REFERENCES datban (MaDatBan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monantronghoadon (
    MaHD VARCHAR(20) NOT NULL,
    MaMon VARCHAR(20) NOT NULL,
    SoLuong INT NOT NULL,
    DonGiaLucBan DECIMAL(15, 2),
    PRIMARY KEY (MaHD, MaMon),
    CONSTRAINT fk_mhd_hd FOREIGN KEY (MaHD) REFERENCES hoadon (MaHD) ON DELETE CASCADE,
    CONSTRAINT fk_mhd_mon FOREIGN KEY (MaMon) REFERENCES thucdon (MaMon) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS giamgia (
    MaGiamGia VARCHAR(20) NOT NULL,
    GiaTriUuDai DECIMAL(15, 2) NOT NULL,
    DieuKienApDung VARCHAR(255),
    ThoiHan DATE NOT NULL,
    PRIMARY KEY (MaGiamGia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS magiamgiahoadon (
    MaHD VARCHAR(20) NOT NULL,
    MaGiamGia VARCHAR(20) NOT NULL,
    PRIMARY KEY (MaHD, MaGiamGia),
    CONSTRAINT fk_mgghd_hd FOREIGN KEY (MaHD) REFERENCES hoadon (MaHD) ON DELETE CASCADE,
    CONSTRAINT fk_mgghd_gg FOREIGN KEY (MaGiamGia) REFERENCES giamgia (MaGiamGia) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sudunggiamgia (
    MaKH VARCHAR(20) NOT NULL,
    MaGiamGia VARCHAR(20) NOT NULL,
    PRIMARY KEY (MaKH, MaGiamGia),
    CONSTRAINT fk_sdgg_kh FOREIGN KEY (MaKH) REFERENCES khachhang (MaKH) ON DELETE CASCADE,
    CONSTRAINT fk_sdgg_gg FOREIGN KEY (MaGiamGia) REFERENCES giamgia (MaGiamGia) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS thanhtoan (
    MaKH VARCHAR(20) NOT NULL,
    MaHD VARCHAR(20) NOT NULL,
    PhuongThuc VARCHAR(30) NOT NULL,
    GiamGia DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    TrangThai VARCHAR(30) NOT NULL,
    PRIMARY KEY (MaKH, MaHD),
    UNIQUE KEY uk_thanhtoan_mahd (MaHD),
    CONSTRAINT fk_thanhtoan_kh FOREIGN KEY (MaKH) REFERENCES khachhang (MaKH) ON DELETE CASCADE,
    CONSTRAINT fk_thanhtoan_hd FOREIGN KEY (MaHD) REFERENCES hoadon (MaHD) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;