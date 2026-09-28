-- =====================================================================================
-- Migration cho 3 tính năng: Công nợ nhà cung cấp, Báo cáo lãi/lỗ & hao hụt, Nhật ký thao tác
-- (tương ứng mục 3, 4, 5 nhóm 1 trong docs/DE_XUAT_TINH_NANG_MOI.md)
--
-- Dự án hiện chạy với spring.jpa.hibernate.ddl-auto=update, nên Hibernate TỰ tạo bảng và cột mới
-- khi khởi động. Trong chế độ đó chỉ cần chạy phần BACKFILL ở mục 1.2 (Hibernate không nạp lại
-- dữ liệu bao giờ) — thiếu bước này thì phiếu nhập cũ có tongtien = 0 và sổ công nợ NCC sẽ sai.
--
-- Chạy TOÀN BỘ script này khi triển khai với ddl-auto=validate (khuyến nghị cho production),
-- vì lúc đó ứng dụng không start nếu database thiếu bảng/cột khai báo trong Entity.
--
-- Viết cho MySQL 8. Lưu ý: MySQL 8 KHÔNG hỗ trợ "ADD COLUMN IF NOT EXISTS" (đó là cú pháp
-- MariaDB), nên phần ALTER TABLE chỉ chạy được MỘT LẦN — chạy lại sẽ báo lỗi "Duplicate column".
-- Phần CREATE TABLE thì chạy lại được nhờ IF NOT EXISTS.
-- Sao lưu database trước khi chạy.
-- =====================================================================================

SET NAMES utf8mb4;

-- -------------------------------------------------------------------------------------
-- 1. CÔNG NỢ NHÀ CUNG CẤP
-- -------------------------------------------------------------------------------------

-- 1.1. Mở rộng thông tin nhà cung cấp (trước đây chỉ có tên + số điện thoại)
ALTER TABLE nhacungcap
    ADD COLUMN diachi        VARCHAR(150)   NULL,
    ADD COLUMN email         VARCHAR(100)   NULL,
    ADD COLUMN masothue      VARCHAR(20)    NULL,
    ADD COLUMN nguoilienhe   VARCHAR(60)    NULL,
    ADD COLUMN hantramacdinh INT            NULL,
    ADD COLUMN congnophaitra DECIMAL(18, 2) NOT NULL DEFAULT 0;

-- 1.2. Chốt tổng tiền và hạn trả trên phiếu nhập
ALTER TABLE phieunhap
    ADD COLUMN tongtien DECIMAL(18, 2) NOT NULL DEFAULT 0,
    ADD COLUMN hantra   DATE           NULL;

-- Backfill tổng tiền cho phiếu cũ. Chỉ chạy một lần cho phiếu đang có tongtien = 0;
-- từ nay PhieunhapService chốt giá trị này ngay lúc tạo phiếu.
UPDATE phieunhap pn
SET pn.tongtien = COALESCE((
        SELECT SUM(ct.soluongnhap * ct.gianhap)
        FROM chitietphieunhap ct
        WHERE ct.idphieunhap = pn.idphieunhap
    ), 0)
WHERE pn.tongtien = 0;

-- Backfill hạn trả cho phiếu nhập cũ đang còn nợ. Phiếu có hantra = NULL bị loại khỏi truy vấn
-- của CongNoNccDenHanScheduler nên sẽ không bao giờ được nhắc, dù thực tế đang nợ.
-- Số ngày lấy theo hantramacdinh của nhà cung cấp; NCC chưa khai thì dùng 7 ngày, khớp mặc định
-- cong-no-ncc.han-tra-mac-dinh trong application.yaml (sửa cả hai chỗ nếu đổi giá trị này).
UPDATE phieunhap pn
    JOIN nhacungcap ncc ON ncc.idncc = pn.idncc
SET pn.hantra = DATE_ADD(pn.ngaynhap, INTERVAL COALESCE(GREATEST(ncc.hantramacdinh, 0), 7) DAY)
WHERE pn.hantra IS NULL
  AND pn.trangthaithanhtoan <> 'DA_THANH_TOAN';

-- 1.3. Các lần trả tiền cho nhà cung cấp
CREATE TABLE IF NOT EXISTS thanhtoannhacungcap (
    idthanhtoanncc VARCHAR(36)    NOT NULL,
    idncc          INT            NOT NULL,
    idphieunhap    VARCHAR(36)    NULL COMMENT 'NULL khi trả gộp nhiều phiếu',
    sotien         DECIMAL(18, 2) NOT NULL,
    hinhthuc       VARCHAR(30)    NULL,
    nguoithuchien  VARCHAR(36)    NULL,
    ghichu         VARCHAR(255)   NULL,
    ngaythanhtoan  DATETIME(6)    NULL,
    PRIMARY KEY (idthanhtoanncc),
    KEY idx_ttncc_ncc (idncc),
    KEY idx_ttncc_phieu (idphieunhap),
    CONSTRAINT fk_ttncc_ncc    FOREIGN KEY (idncc)         REFERENCES nhacungcap (idncc),
    CONSTRAINT fk_ttncc_phieu  FOREIGN KEY (idphieunhap)   REFERENCES phieunhap (idphieunhap),
    CONSTRAINT fk_ttncc_nguoi  FOREIGN KEY (nguoithuchien) REFERENCES taikhoan (idtaikhoan)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 1.4. Sổ cái công nợ nhà cung cấp (soi gương bảng lichsucongno phía khách hàng)
CREATE TABLE IF NOT EXISTS lichsucongnoncc (
    idlichsucongnoncc VARCHAR(36) NOT NULL,
    idncc             INT         NOT NULL,
    loaithaydoi       ENUM ('TANG', 'GIAM', 'DIEU_CHINH')      NULL,
    sotien            DECIMAL(18, 2)                            NULL,
    sodusaukhithaydoi DECIMAL(18, 2)                            NULL,
    nguongocid        VARCHAR(36)                               NULL,
    nguongocloai      ENUM ('PHIEU_NHAP', 'THANH_TOAN_NCC')     NULL,
    nguoithuchien     VARCHAR(36)                               NULL,
    ghichu            VARCHAR(255)                              NULL,
    ngaytao           DATETIME(6)                               NULL,
    PRIMARY KEY (idlichsucongnoncc),
    KEY idx_lscnncc_ncc (idncc),
    CONSTRAINT fk_lscnncc_ncc   FOREIGN KEY (idncc)         REFERENCES nhacungcap (idncc),
    CONSTRAINT fk_lscnncc_nguoi FOREIGN KEY (nguoithuchien) REFERENCES taikhoan (idtaikhoan)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------------------------------
-- 2. BÁO CÁO LÃI/LỖ — PHÂN BỔ XUẤT KHO THEO LÔ
-- -------------------------------------------------------------------------------------

-- Ghi lại dòng đơn hàng nào lấy hàng từ lô nào. Trước đây truLoFifo() biết chính xác điều này
-- nhưng chỉ ghi đè soluongconlai rồi vứt đi, nên giá vốn không tính ngược được.
-- soluong > 0 là xuất kho, soluong < 0 là hoàn trả lại lô (hủy đơn / cân nhẹ hơn dự kiến).
CREATE TABLE IF NOT EXISTS phanboxuatkho (
    idphanbo           VARCHAR(36)    NOT NULL,
    idchitietdonhang   VARCHAR(36)    NOT NULL,
    idchitietphieunhap VARCHAR(36)    NOT NULL,
    soluong            DECIMAL(12, 2) NOT NULL,
    gianhaptaithoidiem DECIMAL(12, 2) NULL COMMENT 'Chốt cứng, không đổi khi sửa giá nhập của lô',
    ngaytao            DATETIME(6)    NULL,
    PRIMARY KEY (idphanbo),
    KEY idx_phanbo_ctdh (idchitietdonhang),
    KEY idx_phanbo_lo (idchitietphieunhap),
    CONSTRAINT fk_phanbo_ctdh FOREIGN KEY (idchitietdonhang)   REFERENCES chitietdonhang (idchitietdonhang),
    CONSTRAINT fk_phanbo_lo   FOREIGN KEY (idchitietphieunhap) REFERENCES chitietphieunhap (idchitietphieunhap)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- LƯU Ý: không backfill được bảng này cho đơn hàng cũ. Dữ liệu phân bổ lô của các đơn đã bán
-- trước khi chạy migration đã bị mất vĩnh viễn (soluongconlai là phép ghi đè phá hủy).
-- Do đó báo cáo biên lợi nhuận chỉ chính xác kể từ ngày triển khai trở đi.
-- Báo cáo hao hụt cân KHÔNG bị ảnh hưởng — nó đọc thẳng khoiluongdukien/khoiluongthucte đã có sẵn.

-- -------------------------------------------------------------------------------------
-- 3. NHẬT KÝ THAO TÁC (AUDIT LOG)
-- -------------------------------------------------------------------------------------

-- Cặp (tenbang, idbanghi) là con trỏ đa hình tới bản ghi bị tác động — cố tình KHÔNG dùng khóa
-- ngoại vì bảng này phải ghi được mọi bảng trong hệ thống.
-- idbanghi để VARCHAR vì khóa chính không đồng nhất kiểu: đơn hàng dùng UUID, bảng giá dùng INT.
CREATE TABLE IF NOT EXISTS nhatkythaotac (
    idnhatky      VARCHAR(36) NOT NULL,
    tenbang       VARCHAR(50)  NULL,
    idbanghi      VARCHAR(36)  NULL,
    hanhdong      VARCHAR(50)  NULL,
    giatricu      TEXT         NULL,
    giatrimoi     TEXT         NULL,
    nguoithuchien VARCHAR(36)  NULL,
    diachiip      VARCHAR(45)  NULL,
    ghichu        VARCHAR(255) NULL,
    thoigian      DATETIME(6)  NULL,
    PRIMARY KEY (idnhatky),
    KEY idx_nhatky_doituong (tenbang, idbanghi),
    KEY idx_nhatky_nguoi_thoigian (nguoithuchien, thoigian),
    CONSTRAINT fk_nhatky_nguoi FOREIGN KEY (nguoithuchien) REFERENCES taikhoan (idtaikhoan)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- =====================================================================================
-- SAU KHI CHẠY MIGRATION
--
-- 1. Khai báo hạn trả mặc định cho từng nhà cung cấp tại /admin/QuanLyCongNoNCC.
--    Để trống = dùng mặc định hệ thống (cong-no-ncc.han-tra-mac-dinh, đang là 7 ngày);
--    nhập 0 = phải trả ngay trong ngày nhập. Mọi phiếu nhập đều luôn có hạn trả.
--
-- 2. Dựng số dư nợ ban đầu cho dữ liệu cũ bằng hai lệnh dưới đây. Sau khi migration xong,
--    mọi phiếu nhập mới đều tự cộng nợ và tự ghi sổ cái, nên PHẦN NÀY CHỈ CHẠY ĐÚNG MỘT LẦN —
--    chạy lại sẽ cộng dồn số dư thành gấp đôi.
-- =====================================================================================

-- 2.1. Số dư hiện tại = tổng tiền các phiếu chưa trả đủ, trừ đi những gì đã trả.
UPDATE nhacungcap ncc
SET ncc.congnophaitra = (
        SELECT COALESCE(SUM(pn.tongtien), 0)
        FROM phieunhap pn
        WHERE pn.idncc = ncc.idncc
          AND pn.trangthaithanhtoan <> 'DA_THANH_TOAN'
    ) - (
        SELECT COALESCE(SUM(tt.sotien), 0)
        FROM thanhtoannhacungcap tt
        WHERE tt.idncc = ncc.idncc
    )
WHERE ncc.congnophaitra IS NULL OR ncc.congnophaitra = 0;

-- 2.2. Ghi một dòng mở sổ cho mỗi NCC có nợ. Không có dòng này thì màn hình lịch sử hiện số dư
--      từ trên trời rơi xuống: sổ cái bắt đầu bằng một khoản thanh toán mà chẳng có khoản nợ nào
--      trước đó. nguoithuchien để NULL vì đây là số liệu chuyển sổ, không phải ai đó thao tác.
INSERT INTO lichsucongnoncc
    (idlichsucongnoncc, idncc, loaithaydoi, sotien, sodusaukhithaydoi,
     nguongocid, nguongocloai, nguoithuchien, ghichu, ngaytao)
SELECT UUID(), ncc.idncc, 'DIEU_CHINH', ABS(ncc.congnophaitra), ncc.congnophaitra,
       NULL, NULL, NULL, 'Số dư mở sổ, chuyển từ phiếu nhập cũ', NOW(6)
FROM nhacungcap ncc
WHERE ncc.congnophaitra <> 0
  AND NOT EXISTS (SELECT 1 FROM lichsucongnoncc ls WHERE ls.idncc = ncc.idncc);
-- =====================================================================================
