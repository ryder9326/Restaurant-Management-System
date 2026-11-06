CREATE DATABASE IF NOT EXISTS `quanlynhahang` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `quanlynhahang`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Bảng Nhân viên (Đã thêm TaiKhoan, MatKhau phục vụ Đăng nhập)
DROP TABLE IF EXISTS `nhanvien`;
CREATE TABLE `nhanvien` (
  `MaNV` varchar(20) NOT NULL,
  `HoVaTen` varchar(100) NOT NULL,
  `Tuoi` int DEFAULT NULL,
  `ChucVu` varchar(100) DEFAULT NULL,
  `NgayBatDau` date DEFAULT NULL,
  `TrangThaiLamViec` varchar(50) DEFAULT NULL,
  `TaiKhoan` varchar(50) UNIQUE DEFAULT NULL,
  `MatKhau` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`MaNV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng Ca làm việc
DROP TABLE IF EXISTS `calamviec`;
CREATE TABLE `calamviec` (
  `MaNV` varchar(20) NOT NULL,
  `BuoiLamViec` varchar(50) NOT NULL,
  `NgayLamViec` date NOT NULL,
  PRIMARY KEY (`MaNV`,`BuoiLamViec`,`NgayLamViec`),
  CONSTRAINT `calamviec_ibfk_1` FOREIGN KEY (`MaNV`) REFERENCES `nhanvien` (`MaNV`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng Quản lý nhân viên
DROP TABLE IF EXISTS `quanlynv`;
CREATE TABLE `quanlynv` (
  `MaNVQuanLy` varchar(20) NOT NULL,
  `MaNVBiQuanLy` varchar(20) NOT NULL,
  PRIMARY KEY (`MaNVQuanLy`,`MaNVBiQuanLy`),
  KEY `MaNVBiQuanLy` (`MaNVBiQuanLy`),
  CONSTRAINT `quanlynv_ibfk_1` FOREIGN KEY (`MaNVQuanLy`) REFERENCES `nhanvien` (`MaNV`) ON DELETE CASCADE,
  CONSTRAINT `quanlynv_ibfk_2` FOREIGN KEY (`MaNVBiQuanLy`) REFERENCES `nhanvien` (`MaNV`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Khách hàng
DROP TABLE IF EXISTS `khachhang`;
CREATE TABLE `khachhang` (
  `MaKH` varchar(20) NOT NULL,
  `HoVaTen` varchar(100) NOT NULL,
  `SDT` varchar(20) DEFAULT NULL,
  `GhiChu` text,
  PRIMARY KEY (`MaKH`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng Bàn ăn
DROP TABLE IF EXISTS `banan`;
CREATE TABLE `banan` (
  `MaBan` varchar(20) NOT NULL,
  `KhuVuc` varchar(50) DEFAULT NULL,
  `SucChua` int DEFAULT NULL,
  `TrangThaiSuDung` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`MaBan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng Thực đơn (Đã thêm TrangThaiMon phục vụ kiểm tra món / báo hết nguyên liệu)
DROP TABLE IF EXISTS `thucdon`;
CREATE TABLE `thucdon` (
  `MaMon` varchar(20) NOT NULL,
  `TenMon` varchar(150) NOT NULL,
  `MoTa` text,
  `GiaBan` decimal(15,2) NOT NULL,
  `TrangThaiMon` varchar(50) DEFAULT 'Đang bán',
  PRIMARY KEY (`MaMon`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng Nguyên liệu
DROP TABLE IF EXISTS `nguyenlieu`;
CREATE TABLE `nguyenlieu` (
  `MaNguyenLieu` varchar(20) NOT NULL,
  `TenNguyenLieu` varchar(150) NOT NULL,
  `DonViTinh` varchar(50) DEFAULT NULL,
  `LuongTon` decimal(15,2) DEFAULT '0.00',
  `HanSuDung` date DEFAULT NULL,
  `MaNV` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`MaNguyenLieu`),
  KEY `MaNV` (`MaNV`),
  CONSTRAINT `nguyenlieu_ibfk_1` FOREIGN KEY (`MaNV`) REFERENCES `nhanvien` (`MaNV`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng Cung cấp nguyên liệu
DROP TABLE IF EXISTS `cungcapnl`;
CREATE TABLE `cungcapnl` (
  `MaNguyenLieu` varchar(20) NOT NULL,
  `TenNhaCungCap` varchar(150) NOT NULL,
  PRIMARY KEY (`MaNguyenLieu`,`TenNhaCungCap`),
  CONSTRAINT `cungcapnl_ibfk_1` FOREIGN KEY (`MaNguyenLieu`) REFERENCES `nguyenlieu` (`MaNguyenLieu`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Bảng Nguyên liệu món ăn
DROP TABLE IF EXISTS `nguyenlieumonan`;
CREATE TABLE `nguyenlieumonan` (
  `MaNguyenLieu` varchar(20) NOT NULL,
  `MaMon` varchar(20) NOT NULL,
  PRIMARY KEY (`MaNguyenLieu`,`MaMon`),
  KEY `MaMon` (`MaMon`),
  CONSTRAINT `nguyenlieumonan_ibfk_1` FOREIGN KEY (`MaNguyenLieu`) REFERENCES `nguyenlieu` (`MaNguyenLieu`) ON DELETE CASCADE,
  CONSTRAINT `nguyenlieumonan_ibfk_2` FOREIGN KEY (`MaMon`) REFERENCES `thucdon` (`MaMon`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bảng Cơ sở vật chất
DROP TABLE IF EXISTS `cosovatchat`;
CREATE TABLE `cosovatchat` (
  `MaTaiSan` varchar(20) NOT NULL,
  `TenTaiSan` varchar(150) NOT NULL,
  `TinhTrang` varchar(100) DEFAULT NULL,
  `MaNV` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`MaTaiSan`),
  KEY `MaNV` (`MaNV`),
  CONSTRAINT `cosovatchat_ibfk_1` FOREIGN KEY (`MaNV`) REFERENCES `nhanvien` (`MaNV`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bảng Cung cấp CSVC
DROP TABLE IF EXISTS `cungcapcsvc`;
CREATE TABLE `cungcapcsvc` (
  `MaTaiSan` varchar(20) NOT NULL,
  `TenNhaCungCap` varchar(150) NOT NULL,
  PRIMARY KEY (`MaTaiSan`,`TenNhaCungCap`),
  CONSTRAINT `cungcapcsvc_ibfk_1` FOREIGN KEY (`MaTaiSan`) REFERENCES `cosovatchat` (`MaTaiSan`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Bảng Đặt bàn
DROP TABLE IF EXISTS `datban`;
CREATE TABLE `datban` (
  `MaDatBan` varchar(20) NOT NULL,
  `ThoiGianDat` datetime DEFAULT NULL,
  `SoLuongKhach` int DEFAULT NULL,
  `GhiChu` text,
  `MaBan` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`MaDatBan`),
  KEY `MaBan` (`MaBan`),
  CONSTRAINT `datban_ibfk_1` FOREIGN KEY (`MaBan`) REFERENCES `banan` (`MaBan`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Bảng Đặt trước
DROP TABLE IF EXISTS `dattruoc`;
CREATE TABLE `dattruoc` (
  `MaKH` varchar(20) NOT NULL,
  `MaDatBan` varchar(20) NOT NULL,
  PRIMARY KEY (`MaKH`,`MaDatBan`),
  KEY `MaDatBan` (`MaDatBan`),
  CONSTRAINT `dattruoc_ibfk_1` FOREIGN KEY (`MaKH`) REFERENCES `khachhang` (`MaKH`) ON DELETE CASCADE,
  CONSTRAINT `dattruoc_ibfk_2` FOREIGN KEY (`MaDatBan`) REFERENCES `datban` (`MaDatBan`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Bảng Đón tiếp
DROP TABLE IF EXISTS `dontiep`;
CREATE TABLE `dontiep` (
  `MaNV` varchar(20) NOT NULL,
  `MaKH` varchar(20) NOT NULL,
  PRIMARY KEY (`MaNV`,`MaKH`),
  KEY `MaKH` (`MaKH`),
  CONSTRAINT `dontiep_ibfk_1` FOREIGN KEY (`MaNV`) REFERENCES `nhanvien` (`MaNV`) ON DELETE CASCADE,
  CONSTRAINT `dontiep_ibfk_2` FOREIGN KEY (`MaKH`) REFERENCES `khachhang` (`MaKH`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Bảng Ngồi
DROP TABLE IF EXISTS `ngoi`;
CREATE TABLE `ngoi` (
  `MaKH` varchar(20) NOT NULL,
  `MaBan` varchar(20) NOT NULL,
  PRIMARY KEY (`MaKH`,`MaBan`),
  KEY `MaBan` (`MaBan`),
  CONSTRAINT `ngoi_ibfk_1` FOREIGN KEY (`MaKH`) REFERENCES `khachhang` (`MaKH`) ON DELETE CASCADE,
  CONSTRAINT `ngoi_ibfk_2` FOREIGN KEY (`MaBan`) REFERENCES `banan` (`MaBan`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Bảng Phục vụ
DROP TABLE IF EXISTS `phucvu`;
CREATE TABLE `phucvu` (
  `MaNV` varchar(20) NOT NULL,
  `MaBan` varchar(20) NOT NULL,
  PRIMARY KEY (`MaNV`,`MaBan`),
  KEY `MaBan` (`MaBan`),
  CONSTRAINT `phucvu_ibfk_1` FOREIGN KEY (`MaNV`) REFERENCES `nhanvien` (`MaNV`) ON DELETE CASCADE,
  CONSTRAINT `phucvu_ibfk_2` FOREIGN KEY (`MaBan`) REFERENCES `banan` (`MaBan`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Bảng Đặt món (Khóa chính gồm cả ThoiGianGoi để gọi nhiều lượt không trùng)
DROP TABLE IF EXISTS `datmon`;
CREATE TABLE `datmon` (
  `MaKH` varchar(20) NOT NULL,
  `MaMon` varchar(20) NOT NULL,
  `SoLuong` int NOT NULL DEFAULT '1',
  `ThoiGianGoi` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `TrangThai` varchar(50) DEFAULT NULL,
  `GhiChu` text,
  PRIMARY KEY (`MaKH`,`MaMon`,`ThoiGianGoi`),
  KEY `MaMon` (`MaMon`),
  CONSTRAINT `datmon_ibfk_1` FOREIGN KEY (`MaKH`) REFERENCES `khachhang` (`MaKH`) ON DELETE CASCADE,
  CONSTRAINT `datmon_ibfk_2` FOREIGN KEY (`MaMon`) REFERENCES `thucdon` (`MaMon`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Bảng Hóa đơn (Đã thêm ThoiGianTao phục vụ Thống kê doanh thu)
DROP TABLE IF EXISTS `hoadon`;
CREATE TABLE `hoadon` (
  `MaHD` varchar(20) NOT NULL,
  `TongTien` decimal(15,2) DEFAULT '0.00',
  `ThoiGianTao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaHD`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Bảng Bàn trong hóa đơn
DROP TABLE IF EXISTS `bantronghoadon`;
CREATE TABLE `bantronghoadon` (
  `MaDatBan` varchar(20) NOT NULL,
  `MaHD` varchar(20) NOT NULL,
  PRIMARY KEY (`MaDatBan`,`MaHD`),
  KEY `MaHD` (`MaHD`),
  CONSTRAINT `bantronghoadon_ibfk_1` FOREIGN KEY (`MaDatBan`) REFERENCES `datban` (`MaDatBan`) ON DELETE CASCADE,
  CONSTRAINT `bantronghoadon_ibfk_2` FOREIGN KEY (`MaHD`) REFERENCES `hoadon` (`MaHD`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Bảng Món ăn trong hóa đơn
DROP TABLE IF EXISTS `monantronghoadon`;
CREATE TABLE `monantronghoadon` (
  `MaHD` varchar(20) NOT NULL,
  `MaMon` varchar(20) NOT NULL,
  `SoLuong` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`MaHD`,`MaMon`),
  KEY `MaMon` (`MaMon`),
  CONSTRAINT `monantronghoadon_ibfk_1` FOREIGN KEY (`MaHD`) REFERENCES `hoadon` (`MaHD`) ON DELETE CASCADE,
  CONSTRAINT `monantronghoadon_ibfk_2` FOREIGN KEY (`MaMon`) REFERENCES `thucdon` (`MaMon`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Bảng Giảm giá
DROP TABLE IF EXISTS `giamgia`;
CREATE TABLE `giamgia` (
  `MaGiamGia` varchar(20) NOT NULL,
  `GiaTriUuDai` decimal(15,2) DEFAULT NULL,
  `DieuKienApDung` text,
  `ThoiHan` datetime DEFAULT NULL,
  PRIMARY KEY (`MaGiamGia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Bảng Mã giảm giá hóa đơn
DROP TABLE IF EXISTS `magiamgiahoadon`;
CREATE TABLE `magiamgiahoadon` (
  `MaHD` varchar(20) NOT NULL,
  `MaGiamGia` varchar(20) NOT NULL,
  PRIMARY KEY (`MaHD`,`MaGiamGia`),
  KEY `MaGiamGia` (`MaGiamGia`),
  CONSTRAINT `magiamgiahoadon_ibfk_1` FOREIGN KEY (`MaHD`) REFERENCES `hoadon` (`MaHD`) ON DELETE CASCADE,
  CONSTRAINT `magiamgiahoadon_ibfk_2` FOREIGN KEY (`MaGiamGia`) REFERENCES `giamgia` (`MaGiamGia`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Bảng Sử dụng giảm giá
DROP TABLE IF EXISTS `sudunggiamgia`;
CREATE TABLE `sudunggiamgia` (
  `MaKH` varchar(20) NOT NULL,
  `MaGiamGia` varchar(20) NOT NULL,
  PRIMARY KEY (`MaKH`,`MaGiamGia`),
  KEY `MaGiamGia` (`MaGiamGia`),
  CONSTRAINT `sudunggiamgia_ibfk_1` FOREIGN KEY (`MaKH`) REFERENCES `khachhang` (`MaKH`) ON DELETE CASCADE,
  CONSTRAINT `sudunggiamgia_ibfk_2` FOREIGN KEY (`MaGiamGia`) REFERENCES `giamgia` (`MaGiamGia`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Bảng Thanh toán
DROP TABLE IF EXISTS `thanhtoan`;
CREATE TABLE `thanhtoan` (
  `MaKH` varchar(20) NOT NULL,
  `MaHD` varchar(20) NOT NULL,
  `PhuongThuc` varchar(100) DEFAULT NULL,
  `GiamGia` decimal(15,2) DEFAULT '0.00',
  `TrangThai` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`MaKH`,`MaHD`),
  KEY `MaHD` (`MaHD`),
  CONSTRAINT `thanhtoan_ibfk_1` FOREIGN KEY (`MaKH`) REFERENCES `khachhang` (`MaKH`) ON DELETE CASCADE,
  CONSTRAINT `thanhtoan_ibfk_2` FOREIGN KEY (`MaHD`) REFERENCES `hoadon` (`MaHD`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;