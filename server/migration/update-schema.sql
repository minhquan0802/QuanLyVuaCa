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

-- Thông báo: hệ thống thông báo real-time (SSE) cho admin/staff
CREATE TABLE thongbao (
    idthongbao VARCHAR(36) NOT NULL PRIMARY KEY,
    idnguoinhan VARCHAR(36) NOT NULL,
    noidung VARCHAR(255) NOT NULL,
    loai VARCHAR(50) NULL,
    link VARCHAR(255) NULL,
    daxem BOOLEAN NOT NULL DEFAULT FALSE,
    thoigiantao DATETIME(6) NOT NULL,
    CONSTRAINT fk_thongbao_taikhoan FOREIGN KEY (idnguoinhan) REFERENCES taikhoan(idtaikhoan)
);