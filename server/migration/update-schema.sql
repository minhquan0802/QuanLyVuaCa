ALTER TABLE chitietphieunhap
DROP
COLUMN trangthaica;

ALTER TABLE chitietphieunhap
    ADD trangthaica LONGTEXT NULL;

ALTER TABLE donhang
DROP
COLUMN trangthaidonhang;

ALTER TABLE donhang
    ADD trangthaidonhang LONGTEXT DEFAULT 'CHO_XAC_NHAN' NULL;

ALTER TABLE donhang
    ALTER trangthaidonhang SET DEFAULT 'CHO_XAC_NHAN';

ALTER TABLE phieunhap
DROP
COLUMN trangthaithanhtoan;

ALTER TABLE phieunhap
    ADD trangthaithanhtoan LONGTEXT NULL;

ALTER TABLE taikhoan
DROP
COLUMN trangthaitk;

ALTER TABLE taikhoan
    ADD trangthaitk LONGTEXT DEFAULT 'HOAT_DONG' NULL;

ALTER TABLE taikhoan
    ALTER trangthaitk SET DEFAULT 'HOAT_DONG';

-- Phiếu thanh lý: tracking số lượng còn lại theo lô (chitietphieunhap) + trạng thái xử lý
ALTER TABLE chitietphieunhap ADD soluongconlai DECIMAL(12,2) NULL;
UPDATE chitietphieunhap SET soluongconlai = soluongnhap WHERE soluongconlai IS NULL;

ALTER TABLE phieuthanhly ADD trangthai LONGTEXT NULL;