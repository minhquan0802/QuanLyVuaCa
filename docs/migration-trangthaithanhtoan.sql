-- Migration: Tách trạng thái thanh toán ra khỏi trạng thái đơn hàng
-- Chạy theo đúng thứ tự từ trên xuống dưới

SET SQL_SAFE_UPDATES = 0;

-- Bước 1: Thêm cột mới (default CHUA_THANH_TOAN cho tất cả đơn hiện có)
ALTER TABLE donhang
ADD COLUMN trangthaithanhtoan ENUM('CHUA_THANH_TOAN', 'DA_THANH_TOAN')
    NOT NULL DEFAULT 'CHUA_THANH_TOAN';

-- Bước 2: Đánh dấu các đơn đã thanh toán
UPDATE donhang
SET trangthaithanhtoan = 'DA_THANH_TOAN'
WHERE trangthaidonhang IN ('DA_THANH_TOAN', 'HOAN_TAT');

-- Bước 3: Đơn DA_THANH_TOAN (POS khách lẻ hoặc VNPAY tại quầy)
--         → lifecycle đã hoàn tất, chuyển sang GIAO_HANG_THANH_CONG
UPDATE donhang
SET trangthaidonhang = 'GIAO_HANG_THANH_CONG'
WHERE trangthaidonhang = 'DA_THANH_TOAN';

-- Bước 4: Đơn HOAN_TAT (đã giao + đã trả đủ)
--         → lifecycle là GIAO_HANG_THANH_CONG, thanh toán đã đánh dấu ở bước 2
UPDATE donhang
SET trangthaidonhang = 'GIAO_HANG_THANH_CONG'
WHERE trangthaidonhang = 'HOAN_TAT';

-- Bước 5: Bỏ DA_THANH_TOAN và HOAN_TAT khỏi ENUM
ALTER TABLE donhang
MODIFY COLUMN trangthaidonhang
    ENUM('CHO_XAC_NHAN', 'DANG_DONG_HANG', 'DANG_VAN_CHUYEN', 'GIAO_HANG_THANH_CONG', 'HUY')
    NOT NULL DEFAULT 'CHO_XAC_NHAN';

SET SQL_SAFE_UPDATES = 1;
