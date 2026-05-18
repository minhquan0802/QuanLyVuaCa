-- Chạy file này trong MySQL trước khi khởi động server
-- Database: QuanLyVuaCa

CREATE TABLE IF NOT EXISTS hoadon (
    idhoadon          VARCHAR(36)    NOT NULL PRIMARY KEY,
    iddonhang         VARCHAR(36)    NOT NULL UNIQUE,
    so_hoa_don        VARCHAR(20),
    ky_hieu           VARCHAR(20),
    vat_rate          FLOAT,
    tien_hang         DECIMAL(15, 2),
    tien_thue         DECIMAL(15, 2),
    tong_thanh_toan   DECIMAL(15, 2),
    ma_cqt            VARCHAR(50),        -- NULL khi demo, điền thật khi có TCT
    trang_thai_hoa_don VARCHAR(20),       -- 'CHUA_XUAT' / 'DA_XUAT'
    ngay_xuat         DATETIME,
    CONSTRAINT fk_hoadon_donhang FOREIGN KEY (iddonhang) REFERENCES donhang(iddonhang)
);
