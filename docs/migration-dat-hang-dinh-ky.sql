-- =====================================================================================
-- Migration cho chức năng "Đặt lại đơn cũ & Đơn định kỳ"
-- (mục 8 nhóm 2 trong docs/DE_XUAT_TINH_NANG_MOI.md)
--
-- Chức năng "Đặt lại" KHÔNG cần bảng mới — nó chỉ đọc đơn cũ rồi ghi vào giỏ hàng đã có.
-- Hai bảng dưới đây chỉ phục vụ lịch đặt định kỳ.
--
-- Dự án đang chạy spring.jpa.hibernate.ddl-auto=update nên Hibernate tự tạo hai bảng này khi
-- khởi động; script chỉ cần thiết khi triển khai với ddl-auto=validate.
--
-- Không có bước backfill: đây là chức năng mới hoàn toàn, không có dữ liệu cũ để chuyển sổ.
--
-- Viết cho MySQL 8. Sao lưu database trước khi chạy.
-- =====================================================================================

SET NAMES utf8mb4;

-- -------------------------------------------------------------------------------------
-- 1. LỊCH ĐẶT HÀNG ĐỊNH KỲ
-- -------------------------------------------------------------------------------------

-- cacngaytrongtuan lưu dạng chuỗi "1,3,5" theo chuẩn ISO (1 = thứ Hai … 7 = Chủ nhật).
-- Không tách thành bảng con vì tập giá trị cố định đúng 7 phần tử và không bao giờ cần JOIN hay
-- lọc theo từng thứ ở tầng SQL — scheduler lấy các lịch đang bật rồi so khớp trong Java.
--
-- lanchaycuoi là chốt chặn trùng đơn: server khởi động lại giữa ngày hoặc job bị gọi hai lần thì
-- lịch đã chạy hôm nay bị bỏ qua thay vì sinh đơn thứ hai cho cùng một buổi sáng.
CREATE TABLE IF NOT EXISTS lichdathangdinhky (
    idlich           VARCHAR(36) NOT NULL,
    idtaikhoan       VARCHAR(36) NOT NULL,
    tenlich          VARCHAR(100) NULL,
    cacngaytrongtuan VARCHAR(20)  NULL COMMENT 'Chuỗi thứ ISO, ví dụ "1,3,5"',
    ngaybatdau       DATE         NULL,
    ngayketthuc      DATE         NULL COMMENT 'NULL = chạy vô thời hạn',
    dangkichhoat     BIT(1)       NOT NULL DEFAULT b'1',
    lanchaycuoi      DATE         NULL COMMENT 'Chốt chặn sinh trùng đơn trong cùng một ngày',
    loilanchaycuoi   VARCHAR(255) NULL,
    ghichu           VARCHAR(255) NULL,
    ngaytao          DATETIME(6)  NULL,
    PRIMARY KEY (idlich),
    KEY idx_lichdh_taikhoan (idtaikhoan),
    KEY idx_lichdh_canchay (dangkichhoat, lanchaycuoi),
    CONSTRAINT fk_lichdh_taikhoan FOREIGN KEY (idtaikhoan) REFERENCES taikhoan (idtaikhoan)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------------------------------
-- 2. GIỎ HÀNG MẪU CỦA LỊCH
-- -------------------------------------------------------------------------------------

-- Cố tình KHÔNG có cột giá: giá cá đổi theo ngày, lịch chỉ mô tả "lấy gì, bao nhiêu". Giá được áp
-- tại thời điểm sinh đơn, đi qua đúng bảng giá đang hiệu lực như mọi đơn khác.
CREATE TABLE IF NOT EXISTS chitietlichdathang (
    idchitietlich  VARCHAR(36) NOT NULL,
    idlich         VARCHAR(36) NOT NULL,
    idchitietcaban INT         NOT NULL,
    iddonvitinh    INT         NOT NULL,
    soluong        INT         NOT NULL,
    PRIMARY KEY (idchitietlich),
    KEY idx_ctlichdh_lich (idlich),
    CONSTRAINT fk_ctlichdh_lich   FOREIGN KEY (idlich)         REFERENCES lichdathangdinhky (idlich),
    CONSTRAINT fk_ctlichdh_sp     FOREIGN KEY (idchitietcaban) REFERENCES chitietsanpham (idchitietcaban),
    CONSTRAINT fk_ctlichdh_dvt    FOREIGN KEY (iddonvitinh)    REFERENCES donvitinh (iddvt)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- =====================================================================================
-- SAU KHI CHẠY MIGRATION
--
-- 1. Đơn tự sinh lúc 5h00 sáng (DonDinhKyScheduler), ở trạng thái CHO_XAC_NHAN — đúng như khách
--    tự đặt. Cá là hàng tươi, số lượng thực giao còn phải cân lại, nên đơn định kỳ không đi tắt
--    qua bước xác nhận của vựa.
--
-- 2. Chỉ tài khoản vaitro = 'CUSTOMER' (khách sỉ) tạo được lịch. Khách lẻ gọi API sẽ nhận lỗi
--    LICH_DINH_KY_CHI_DANH_CHO_KHACH_SI.
--
-- 3. Lịch của khách đang vượt hạn mức công nợ vẫn chạy nhưng tạo đơn thất bại — lý do được ghi
--    vào lichdathangdinhky.loilanchaycuoi, báo cho khách và cho ADMIN qua thông báo. Kiểm tra
--    nhanh các lịch đang hỏng:
--
--    SELECT l.idlich, t.email, l.tenlich, l.lanchaycuoi, l.loilanchaycuoi
--    FROM lichdathangdinhky l
--        JOIN taikhoan t ON t.idtaikhoan = l.idtaikhoan
--    WHERE l.loilanchaycuoi IS NOT NULL
--      AND l.dangkichhoat = b'1';
-- =====================================================================================
