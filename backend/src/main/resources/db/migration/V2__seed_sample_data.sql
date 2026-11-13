-- =================================================================================
-- Script khởi tạo dữ liệu mẫu kiểm thử (Flyway Migration V2).
-- Chứa đầy đủ tài khoản phân quyền (ADMIN, MANAGER, WAITER, CASHIER, INVENTORY_STAFF),
-- khách hàng 'Nguyễn Văn A' và món 'Cơm Cà Ri' để kiểm thử 10 truy vấn trong báo cáo.
-- =================================================================================

INSERT INTO nhanvien (MaNV, HoVaTen, Tuoi, ChucVu, NgayBatDau, TrangThaiLamViec, Username, PasswordHash) VALUES
('NV001', 'Phạm Trung Chính', 30, 'ADMIN', '2024-01-10', 'DANG_LAM_VIEC', 'admin', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG'),
('NV002', 'Mai Xuân Đại', 28, 'MANAGER', '2024-02-15', 'DANG_LAM_VIEC', 'manager', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG'),
('NV003', 'Nguyễn Văn Hiếu', 22, 'WAITER', '2025-01-05', 'DANG_LAM_VIEC', 'waiter', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG'),
('NV004', 'Phan Minh Duy', 24, 'CASHIER', '2025-03-01', 'DANG_LAM_VIEC', 'cashier', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG'),
('NV005', 'Vũ Trung Kiên', 25, 'INVENTORY_STAFF', '2025-04-12', 'DANG_LAM_VIEC', 'inventory', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG');

INSERT INTO quanlynv (MaNVQuanLy, MaNVBiQuanLy) VALUES
('NV001', 'NV002'),
('NV002', 'NV003'),
('NV002', 'NV004'),
('NV002', 'NV005');

INSERT INTO calamviec (MaNV, BuoiLamViec, NgayLamViec) VALUES
('NV003', 'CA_SANG', CURDATE()),
('NV004', 'CA_SANG', CURDATE()),
('NV005', 'CA_CHIEU', CURDATE());

INSERT INTO cosovatchat (MaTaiSan, TenTaiSan, TinhTrang, MaNV) VALUES
('TS001', 'Máy pha cà phê công nghiệp', 'Tốt', 'NV005'),
('TS002', 'Hệ thống điều hòa trung tâm tầng 1', 'Tốt', 'NV005');

INSERT INTO cungcapcsvc (MaTaiSan, TenNhaCungCap) VALUES
('TS001', 'Công ty Thiết bị Nhà hàng Á Âu'),
('TS002', 'Điện máy Daikin Việt Nam');

INSERT INTO nguyenlieu (MaNguyenLieu, TenNguyenLieu, DonViTinh, LuongTon, HanSuDung, MaNV) VALUES
('NL001', 'Gạo ST25', 'kg', 150.000, DATE_ADD(CURDATE(), INTERVAL 180 DAY), 'NV005'),
('NL002', 'Thịt gà phi lê', 'kg', 45.000, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'NV005'),
('NL003', 'Bột cà ri Nhật Bản', 'gói', 80.000, DATE_ADD(CURDATE(), INTERVAL 365 DAY), 'NV005'),
('NL004', 'Khoai tây Đà Lạt', 'kg', 60.000, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'NV005'),
('NL005', 'Thăn bò Úc', 'kg', 35.000, DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'NV005');

INSERT INTO cungcapnl (MaNguyenLieu, TenNhaCungCap) VALUES
('NL001', 'Nông sản Sạch Hà Nội'),
('NL002', 'Thực phẩm CP Việt Nam'),
('NL003', 'Thực phẩm Nhập khẩu Tokyo Food'),
('NL004', 'Nông sản Đà Lạt Gap'),
('NL005', 'Thực phẩm Nhập khẩu Aussie Beef');

INSERT INTO khachhang (MaKH, HoVaTen, SDT, GhiChu) VALUES
('KH001', 'Nguyễn Văn A', '0912345678', 'Khách VIP hay ngồi tầng 2'),
('KH002', 'Trần Thị B', '0987654321', 'Dị ứng đậu phộng');

INSERT INTO banan (MaBan, KhuVuc, SucChua, TrangThaiSuDung) VALUES
('BAN01', 'Tầng 1 - Sảnh chính', 4, 'DANG_PHUC_VU'),
('BAN02', 'Tầng 1 - Sảnh chính', 6, 'TRONG'),
('BAN03', 'Tầng 2 - Phòng VIP', 8, 'DA_DAT_TRUOC'),
('BAN04', 'Sân vườn', 4, 'TRONG');

INSERT INTO datban (MaDatBan, ThoiGianDat, SoLuongKhach, GhiChu, MaKH, MaBan) VALUES
('DB001', NOW(), 4, 'Đặt bàn ăn trưa', 'KH001', 'BAN01'),
('DB002', DATE_ADD(NOW(), INTERVAL 3 HOUR), 6, 'Tiệc sinh nhật', 'KH002', 'BAN03');

INSERT INTO dontiep (MaNV, MaKH) VALUES
('NV003', 'KH001'),
('NV003', 'KH002');

INSERT INTO ngoi (MaKH, MaBan) VALUES
('KH001', 'BAN01');

INSERT INTO phucvu (MaNV, MaBan) VALUES
('NV003', 'BAN01'),
('NV003', 'BAN03');

INSERT INTO thucdon (MaMon, TenMon, MoTa, GiaBan) VALUES
('MON01', 'Cơm Cà Ri', 'Cơm cà ri gà kiểu Nhật đậm đà kèm khoai tây', 85000.00),
('MON02', 'Bò Bít Tết Sốt Tiêu Đen', 'Thăn bò Úc áp chảo dùng kèm khoai tây nghiền', 220000.00),
('MON03', 'Salad Hoàng Đế', 'Rau củ hữu cơ trộn sốt Caesar truyền thống', 65000.00);

INSERT INTO nguyenlieumonan (MaMon, MaNguyenLieu) VALUES
('MON01', 'NL001'),
('MON01', 'NL002'),
('MON01', 'NL003'),
('MON01', 'NL004'),
('MON02', 'NL004'),
('MON02', 'NL005');

INSERT INTO datmon (MaKH, MaMon, ThoiGianGoi, SoLuong, TrangThai, GhiChu) VALUES
('KH001', 'MON01', NOW(), 2, 'DA_PHUC_VU', 'Ít cay'),
('KH001', 'MON02', DATE_ADD(NOW(), INTERVAL 1 SECOND), 1, 'DANG_CHE_BIEN', 'Chín vừa (Medium)');

INSERT INTO giamgia (MaGiamGia, GiaTriUuDai, DieuKienApDung, ThoiHan) VALUES
('GG001', 50000.00, 'Đơn tối thiểu 200000', DATE_ADD(CURDATE(), INTERVAL 60 DAY)),
('GG002', 30000.00, 'Đơn tối thiểu 100000', DATE_ADD(CURDATE(), INTERVAL 30 DAY));

INSERT INTO hoadon (MaHD, TongTien) VALUES
('HD001', 340000.00);

INSERT INTO bantronghoadon (MaHD, MaDatBan) VALUES
('HD001', 'DB001');

INSERT INTO monantronghoadon (MaHD, MaMon, SoLuong, DonGiaLucBan) VALUES
('HD001', 'MON01', 2, 85000.00),
('HD001', 'MON02', 1, 220000.00);

INSERT INTO magiamgiahoadon (MaHD, MaGiamGia) VALUES
('HD001', 'GG001');

INSERT INTO sudunggiamgia (MaKH, MaGiamGia) VALUES
('KH001', 'GG001');

INSERT INTO thanhtoan (MaKH, MaHD, PhuongThuc, GiamGia, TrangThai) VALUES
('KH001', 'HD001', 'CHUYEN_KHOAN', 50000.00, 'DA_THANH_TOAN');