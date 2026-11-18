CREATE TABLE id_sequences (
    prefix VARCHAR(10) NOT NULL,
    current_val BIGINT NOT NULL,
    pad_length INT NOT NULL,
    PRIMARY KEY (prefix)
);

INSERT INTO id_sequences (prefix, current_val, pad_length)
SELECT 'NV', COALESCE(MAX(CAST(SUBSTRING(MaNV, 3) AS UNSIGNED)), 0), 3 FROM nhanvien;
INSERT INTO id_sequences (prefix, current_val, pad_length)
SELECT 'TS', COALESCE(MAX(CAST(SUBSTRING(MaTaiSan, 3) AS UNSIGNED)), 0), 3 FROM cosovatchat;
INSERT INTO id_sequences (prefix, current_val, pad_length)
SELECT 'NL', COALESCE(MAX(CAST(SUBSTRING(MaNguyenLieu, 3) AS UNSIGNED)), 0), 3 FROM nguyenlieu;
INSERT INTO id_sequences (prefix, current_val, pad_length)
SELECT 'KH', COALESCE(MAX(CAST(SUBSTRING(MaKH, 3) AS UNSIGNED)), 0), 3 FROM khachhang;
INSERT INTO id_sequences (prefix, current_val, pad_length)
SELECT 'BAN', COALESCE(MAX(CAST(SUBSTRING(MaBan, 4) AS UNSIGNED)), 0), 2 FROM banan;
INSERT INTO id_sequences (prefix, current_val, pad_length)
SELECT 'DB', COALESCE(MAX(CAST(SUBSTRING(MaDatBan, 3) AS UNSIGNED)), 0), 3 FROM datban;
INSERT INTO id_sequences (prefix, current_val, pad_length)
SELECT 'MON', COALESCE(MAX(CAST(SUBSTRING(MaMon, 4) AS UNSIGNED)), 0), 3 FROM thucdon;
INSERT INTO id_sequences (prefix, current_val, pad_length)
SELECT 'HD', COALESCE(MAX(CAST(SUBSTRING(MaHD, 3) AS UNSIGNED)), 0), 3 FROM hoadon;
INSERT INTO id_sequences (prefix, current_val, pad_length)
SELECT 'GG', COALESCE(MAX(CAST(SUBSTRING(MaGiamGia, 3) AS UNSIGNED)), 0), 3 FROM giamgia;
