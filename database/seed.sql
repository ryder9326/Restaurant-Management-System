USE `quanlynhahang`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Dữ liệu Nhân viên (Tài khoản mẫu cho Quản lý, Phục vụ, Bếp, Thu ngân; Mật khẩu: 123456)
INSERT INTO `nhanvien` (`MaNV`, `HoVaTen`, `Tuoi`, `ChucVu`, `NgayBatDau`, `TrangThaiLamViec`, `TaiKhoan`, `MatKhau`) VALUES
('NV01','Nguyễn Văn Hùng',35,'Quản lý','2022-01-15','Đang làm','quanly1','123456'),
('NV02','Trần Thị Mai',32,'Quản lý','2022-03-10','Đang làm','quanly2','123456'),
('NV03','Lê Văn Đạt',22,'Phục vụ','2024-05-20','Đang làm','phucvu1','123456'),
('NV04','Phạm Thị Lan',21,'Phục vụ','2024-06-15','Đang làm','phucvu2','123456'),
('NV05','Ngô Kiến Huy',24,'Phục vụ','2023-08-14','Đang làm','phucvu3','123456'),
('NV06','Vũ Trọng Phụng',40,'Bếp trưởng','2021-11-20','Đang làm','beptruong','123456'),
('NV07','Bùi Xuân Huấn',26,'Đầu bếp','2023-02-11','Đang làm','daubep1','123456'),
('NV08','Hoàng Thu Thủy',24,'Thu ngân','2024-01-05','Đang làm','thungan1','123456'),
('NV09','Lý Nhã Kỳ',23,'Lễ tân','2024-09-10','Đang làm','letan1','123456'),
('NV10','Đinh Tiến Dũng',29,'Bảo vệ','2023-12-01','Đang làm','baove1','123456');

-- 2. Dữ liệu Ca làm việc
INSERT INTO `calamviec` VALUES
('NV01','Ca Sáng','2026-11-01'),('NV02','Ca Tối','2026-11-01'),
('NV03','Ca Sáng','2026-11-01'),('NV03','Ca Tối','2026-11-01'),
('NV04','Ca Sáng','2026-11-01'),('NV05','Ca Tối','2026-11-01'),
('NV06','Cả Ngày','2026-11-01'),('NV07','Ca Sáng','2026-11-01'),
('NV08','Cả Ngày','2026-11-01'),('NV09','Ca Sáng','2026-11-01');

-- 3. Dữ liệu Quản lý nhân viên
INSERT INTO `quanlynv` VALUES
('NV01','NV03'),('NV01','NV04'),('NV02','NV05'),('NV02','NV06'),
('NV06','NV07'),('NV01','NV08'),('NV01','NV09'),('NV02','NV10');

-- 4. Dữ liệu Khách hàng
INSERT INTO `khachhang` VALUES
('KH01','Nguyễn Văn A','0901234567','Khách VIP, thích ngồi gần cửa sổ'),
('KH02','Trần Thị Bích','0912345678','Dị ứng đậu phộng'),
('KH03','Lê Hoàng Nam','0923456789','Khách quen cuối tuần'),
('KH04','Phạm Minh Tuấn','0934567890','Thường đi cùng gia đình, cần ghế trẻ em'),
('KH05','Hoàng Yến Chibi','0945678901','Ăn ít cay'),
('KH06','Vũ Đình Liên','0956789012','Hay đặt phòng VIP tiếp khách'),
('KH07','Đặng Thu Thảo','0967890123','Thích đồ uống ít đường'),
('KH08','Bùi Anh Tuấn','0978901234','Khách vãng lai');

-- 5. Dữ liệu Bàn ăn
INSERT INTO `banan` VALUES
('BAN01','Tầng 1',2,'Đang sử dụng'),('BAN02','Tầng 1',4,'Đang sử dụng'),
('BAN03','Tầng 1',4,'Trống'),('BAN04','Tầng 2',6,'Đang sử dụng'),
('BAN05','Tầng 2',8,'Đang sử dụng'),('BAN06','Tầng 2',4,'Đã đặt'),
('BAN07','Phòng VIP',10,'Đang sử dụng'),('BAN08','Phòng VIP',12,'Trống'),
('BAN09','Sân vườn',4,'Đang sử dụng'),('BAN10','Sân vườn',6,'Đã đặt');

-- 6. Dữ liệu Thực đơn
INSERT INTO `thucdon` (`MaMon`, `TenMon`, `MoTa`, `GiaBan`, `TrangThaiMon`) VALUES
('MON01','Phở Bò Kobe','Phở bò truyền thống kết hợp thịt bò Kobe thượng hạng',150000.00,'Đang bán'),
('MON02','Cơm Cà Ri','Cơm trắng gạo ST25 dùng kèm sốt cà ri gà kiểu Nhật',85000.00,'Đang bán'),
('MON03','Bún Chả Hà Nội','Bún chả thịt nướng than hoa kèm nem cua bể',65000.00,'Đang bán'),
('MON04','Gà Nướng Mật Ong','Gà đồi nướng nguyên con quết mật ong rừng',350000.00,'Đang bán'),
('MON05','Lẩu Thái Hải Sản','Nồi lẩu chua cay cho 4-6 người gồm tôm, mực, cá',450000.00,'Đang bán'),
('MON06','Salad Cá Ngừ','Rau xà lách hữu cơ trộn cá ngừ đại dương ngâm dầu',95000.00,'Đang bán'),
('MON07','Bò Lúc Lắc Khoai Tây','Thịt thăn bò Úc xào lúc lắc kèm khoai tây chiên',180000.00,'Đang bán'),
('MON08','Nước Ép Dưa Hấu','Nước ép dưa hấu tươi nguyên chất không đường',40000.00,'Đang bán'),
('MON09','Trà Đào Cam Sả','Hồng trà ủ lạnh kết hợp đào miếng và sả tươi',45000.00,'Đang bán'),
('MON10','Bia Heineken','Bia Heineken lon cao 330ml ướp lạnh',25000.00,'Đang bán');

-- 7. Dữ liệu Nguyên liệu
INSERT INTO `nguyenlieu` VALUES
('NL01','Thịt bò Kobe','Kg',12.50,'2026-11-15','NV06'),
('NL02','Gà đồi tươi','Con',25.00,'2026-11-05','NV06'),
('NL03','Gạo ST25','Kg',150.00,'2027-05-01','NV07'),
('NL04','Bột cà ri Nhật Bản','Hộp',40.00,'2027-08-15','NV07'),
('NL05','Thịt ba chỉ lợn','Kg',30.00,'2026-11-04','NV06'),
('NL06','Hải sản tổng hợp (Tôm, Mực)','Kg',35.00,'2026-11-04','NV06'),
('NL07','Cá ngừ đại dương','Kg',10.00,'2026-11-06','NV06'),
('NL08','Rau xà lách Đà Lạt','Kg',15.00,'2026-11-03','NV07'),
('NL09','Dưa hấu Long An','Quả',30.00,'2026-11-10','NV07'),
('NL10','Bia Heineken','Thùng',60.00,'2027-10-01','NV01');

-- 8. Dữ liệu Cung cấp nguyên liệu
INSERT INTO `cungcapnl` VALUES
('NL01','Công ty Bò Nhật Bản Kamebishi'),('NL01','Thực Phẩm Nhập Khẩu Gofood'),
('NL02','Trang Trại Gà Đồi Yên Thế'),('NL03','Đại Lý Gạo Sóc Trăng Chính Hiệu'),
('NL04','Thực Phẩm Á Châu'),('NL05','CP Fresh Mart'),
('NL06','Hải Sản Biển Đông'),('NL06','Vựa Hải Sản Hạ Long'),
('NL07','Hải Sản Phú Quốc'),('NL08','Nông Sản Sạch Đà Lạt GAP'),
('NL09','Nông Sản Miền Tây'),('NL10','Tổng Đại Lý Bia Sài Gòn - Hà Nội');

-- 9. Dữ liệu Nguyên liệu món ăn
INSERT INTO `nguyenlieumonan` VALUES
('NL01','MON01'),('NL02','MON02'),('NL03','MON02'),('NL04','MON02'),
('NL05','MON03'),('NL02','MON04'),('NL06','MON05'),('NL07','MON06'),
('NL08','MON06'),('NL01','MON07'),('NL09','MON08'),('NL10','MON10');

-- 10. Dữ liệu Cơ sở vật chất
INSERT INTO `cosovatchat` VALUES
('TS01','Điều hòa âm trần Daikin','Hoạt động tốt','NV01'),
('TS02','Bộ bàn ghế gỗ sồi','Hoạt động tốt','NV01'),
('TS03','Tủ đông công nghiệp 4 cánh','Đang bảo trì','NV06'),
('TS04','Máy POS thu ngân cảm ứng','Hoạt động tốt','NV08'),
('TS05','Bếp Á công nghiệp 3 họng','Hoạt động tốt','NV06'),
('TS06','Hệ thống camera an ninh','Hoạt động tốt','NV10'),
('TS07','Máy rửa bát công nghiệp','Hoạt động tốt','NV07'),
('TS08','Bộ sofa da phòng VIP','Mới 100%','NV02');

-- 11. Dữ liệu Cung cấp CSVC
INSERT INTO `cungcapcsvc` VALUES
('TS01','Công ty Điện lạnh Bách Khoa'),('TS01','Điện Máy Xanh'),
('TS02','Đồ Gỗ Mỹ Nghệ Đồng Kỵ'),('TS02','Nội Thất Hòa Phát'),
('TS03','Thiết Bị Bếp Toàn Phát'),('TS04','Công ty Cổ phần Giải pháp Thanh toán VNPay'),
('TS05','Thiết Bị Bếp Á Âu'),('TS06','Hikvision Việt Nam'),
('TS07','Bosch Việt Nam'),('TS08','Nội Thất Phố Xinh');

-- 12. Dữ liệu Đặt bàn
INSERT INTO `datban` VALUES
('DB01','2026-11-01 11:00:00',2,'Ngồi bàn 2 người tầng 1','BAN01'),
('DB02','2026-11-01 11:30:00',4,'Cần 1 ghế trẻ em','BAN02'),
('DB03','2026-11-01 12:00:00',5,'Gia đình ăn trưa','BAN04'),
('DB04','2026-11-01 18:00:00',4,'Góc sân vườn thoáng mát','BAN09'),
('DB05','2026-11-01 18:30:00',6,'Nhóm bạn liên hoan','BAN05'),
('DB06','2026-11-01 19:00:00',10,'Tiếp đối tác công ty','BAN07'),
('DB07','2026-11-02 11:30:00',3,'Đặt trước cho trưa mai','BAN06'),
('DB08','2026-11-02 19:00:00',6,'Tiệc sinh nhật ngoài trời','BAN10');

-- 13. Dữ liệu Đặt trước
INSERT INTO `dattruoc` VALUES
('KH01','DB01'),('KH02','DB02'),('KH03','DB03'),('KH04','DB04'),
('KH05','DB05'),('KH06','DB06'),('KH07','DB07'),('KH08','DB08');

-- 14. Dữ liệu Đón tiếp
INSERT INTO `dontiep` VALUES
('NV09','KH01'),('NV09','KH02'),('NV09','KH03'),('NV09','KH04'),
('NV01','KH05'),('NV02','KH06'),('NV09','KH07'),('NV09','KH08');

-- 15. Dữ liệu Ngồi
INSERT INTO `ngoi` VALUES
('KH01','BAN01'),('KH02','BAN02'),('KH03','BAN04'),
('KH05','BAN05'),('KH06','BAN07'),('KH04','BAN09');

-- 16. Dữ liệu Phục vụ
INSERT INTO `phucvu` VALUES
('NV03','BAN01'),('NV03','BAN02'),('NV04','BAN04'),('NV04','BAN05'),
('NV03','BAN06'),('NV05','BAN07'),('NV05','BAN09'),('NV04','BAN10');

-- 17. Dữ liệu Đặt món
INSERT INTO `datmon` VALUES
('KH01','MON01',2,'2026-11-01 11:10:00','Đã phục vụ','Không hành lá'),
('KH01','MON02',1,'2026-11-01 11:10:00','Đã phục vụ','Thêm sốt cà ri'),
('KH02','MON04',1,'2026-11-01 11:40:00','Đã phục vụ','Chặt miếng vừa ăn'),
('KH02','MON08',2,'2026-11-01 11:40:00','Đã phục vụ','Ít đá'),
('KH03','MON05',1,'2026-11-01 12:15:00','Đã phục vụ','Cay vừa'),
('KH03','MON10',5,'2026-11-01 12:15:00','Đã phục vụ','Lấy thêm cốc đá'),
('KH04','MON03',2,'2026-11-01 18:10:00','Đã phục vụ','Nước chấm ấm'),
('KH04','MON09',2,'2026-11-01 18:10:00','Đã phục vụ','Bình thường'),
('KH05','MON06',1,'2026-11-01 18:40:00','Đang chế biến','Không sốt mayonnaise'),
('KH05','MON07',1,'2026-11-01 18:40:00','Đang chế biến','Thịt bò chín kỹ'),
('KH06','MON04',1,'2026-11-01 19:15:00','Đã phục vụ','Phòng VIP'),
('KH06','MON05',1,'2026-11-01 19:15:00','Đã phục vụ','Phòng VIP'),
('KH06','MON10',10,'2026-11-01 19:15:00','Đã phục vụ','Ướp lạnh sâu');

-- 18. Dữ liệu Hóa đơn (Có thời gian tạo để thống kê doanh thu)
INSERT INTO `hoadon` (`MaHD`, `TongTien`, `ThoiGianTao`) VALUES
('HD01',385000.00,'2026-11-01 12:30:00'),
('HD02',430000.00,'2026-11-01 13:00:00'),
('HD03',575000.00,'2026-11-01 13:45:00'),
('HD04',220000.00,'2026-11-01 19:30:00'),
('HD05',275000.00,'2026-11-01 20:00:00'),
('HD06',1050000.00,'2026-11-01 21:15:00'),
('HD07',255000.00,'2026-11-02 12:45:00'),
('HD08',380000.00,'2026-11-02 20:30:00');

-- 19. Dữ liệu Bàn trong hóa đơn
INSERT INTO `bantronghoadon` VALUES
('DB01','HD01'),('DB02','HD02'),('DB03','HD03'),('DB04','HD04'),
('DB05','HD05'),('DB06','HD06'),('DB07','HD07'),('DB08','HD08');

-- 20. Dữ liệu Món ăn trong hóa đơn
INSERT INTO `monantronghoadon` VALUES
('HD01','MON01',2),('HD01','MON02',1),('HD02','MON04',1),('HD02','MON08',2),
('HD03','MON05',1),('HD03','MON10',5),('HD04','MON03',2),('HD04','MON09',2),
('HD05','MON06',1),('HD05','MON07',1),('HD06','MON04',1),('HD06','MON05',1),
('HD06','MON10',10),('HD07','MON02',3),('HD08','MON01',2),('HD08','MON08',2);

-- 21. Dữ liệu Giảm giá
INSERT INTO `giamgia` VALUES
('GG01',20000.00,'Giảm 20k cho hóa đơn từ 200k','2026-12-31 23:59:59'),
('GG02',50000.00,'Giảm 50k cho hóa đơn từ 500k','2026-12-31 23:59:59'),
('GG03',100000.00,'Giảm 100k cho hóa đơn từ 1 triệu','2026-12-31 23:59:59'),
('GG04',30000.00,'Ưu đãi khách hàng thân thiết (HĐ từ 300k)','2026-11-30 23:59:59'),
('GG05',15000.00,'Giảm 15k khi gọi từ 2 đồ uống','2026-11-15 23:59:59');

-- 22. Dữ liệu Mã giảm giá hóa đơn
INSERT INTO `magiamgiahoadon` VALUES
('HD01','GG01'),('HD07','GG01'),('HD03','GG02'),('HD06','GG03'),
('HD01','GG04'),('HD02','GG04'),('HD08','GG04'),('HD04','GG05');

-- 23. Dữ liệu Sử dụng giảm giá
INSERT INTO `sudunggiamgia` VALUES
('KH01','GG01'),('KH07','GG01'),('KH03','GG02'),('KH06','GG03'),
('KH01','GG04'),('KH02','GG04'),('KH08','GG04'),('KH04','GG05');

-- 24. Dữ liệu Thanh toán
INSERT INTO `thanhtoan` VALUES
('KH01','HD01','Chuyển khoản',50000.00,'Đã thanh toán'),
('KH02','HD02','Tiền mặt',30000.00,'Đã thanh toán'),
('KH03','HD03','Thẻ tín dụng',50000.00,'Đã thanh toán'),
('KH04','HD04','Tiền mặt',15000.00,'Đã thanh toán'),
('KH05','HD05','Chuyển khoản',0.00,'Chưa thanh toán'),
('KH06','HD06','Thẻ tín dụng',100000.00,'Đã thanh toán'),
('KH07','HD07','Chuyển khoản',20000.00,'Chưa thanh toán'),
('KH08','HD08','Tiền mặt',30000.00,'Chưa thanh toán');

SET FOREIGN_KEY_CHECKS = 1;