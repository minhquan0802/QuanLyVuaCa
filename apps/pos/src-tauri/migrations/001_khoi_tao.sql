-- ============================================================================
--  Migration 001 — khoi tao lieu do POS tren may quay
--
--  NOI DUNG LAY TU docs/pos/schema-client.sql, chi bo cac cau PRAGMA vi
--  migration cua sqlx chay trong mot transaction, ma PRAGMA journal_mode
--  khong doi duoc trong transaction. Cac PRAGMA duoc dat luc mo ket noi
--  o NguonSQLite.khoiTao().
--
--  SUA LIEU DO: sua ca hai tep, hoac them migration 002 moi.
-- ============================================================================

-- ============================================================================
-- ============================================================================
--  POS VUA CA - LUOC DO SQLITE TREN MAY QUAY
--  SQLite 3 (tauri-plugin-sql)  |  %APPDATA%/vuaca-pos/pos.db
--  Bam theo docs/pos/DAC-TA.md v1.2
--
--  MAY QUAY LA NGUON SU THAT cua toan bo he thong. Host chi la noi chua ban
--  sao de xem tu xa, khong dieu phoi gi. Vi vay moi bang o day deu la ban
--  goc, khong phai cache.
--
--  Toan bo tep nay LA BAN DUY NHAT TREN DOI cua du lieu chua dong bo.
--  Phai sao luu hang ngay (DAC-TA.md PC-06).
--
--  Kieu du lieu: SQLite khong co NUMERIC that su.
--    - Tien       -> INTEGER, don vi dong VND
--    - Khoi luong -> INTEGER, don vi gram   (32,500 kg -> 32500)
--    - Thoi diem  -> TEXT ISO 8601 co offset
--    - Ngay       -> TEXT 'YYYY-MM-DD'
--    TUYET DOI khong dung REAL cho tien hoac khoi luong.
-- ============================================================================


-- ===========================================================================
--  A. DANH MUC   (nhap tai quay; sau nay dong bo len Host)
-- ===========================================================================

CREATE TABLE nhom_gia (
    id          TEXT PRIMARY KEY,
    ma          TEXT NOT NULL,          -- 'LE' | 'SI_GAN' | 'SI_XA' | 'SI_VIP'
    ten         TEXT NOT NULL,
    la_si       INTEGER NOT NULL,       -- 1 = don phai qua buoc dong hang
    thu_tu      INTEGER NOT NULL DEFAULT 0,
    la_mac_dinh INTEGER NOT NULL DEFAULT 0
);

-- Don vi tinh + he so quy doi kg (giu dung mo hinh project cu).
-- he_so_kg luu theo PHAN NGHIN: 25,000 kg/thung -> 25000. 0 = khong quy doi.
CREATE TABLE don_vi_tinh (
    id       TEXT PRIMARY KEY,
    ma       TEXT NOT NULL,          -- 'KG' | 'CON' | 'THUNG'
    ten      TEXT NOT NULL,
    he_so_kg INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE san_pham (
    id          TEXT PRIMARY KEY,
    ma_sku      TEXT NOT NULL,
    loai_ca_id  TEXT NOT NULL,
    loai_ca_ten TEXT NOT NULL,
    size_ca_ten TEXT NOT NULL,
    thu_tu_size INTEGER NOT NULL DEFAULT 0,
    don_vi_mac_dinh_id TEXT REFERENCES don_vi_tinh(id),  -- chi la goi y
    anh_url     TEXT
);
CREATE INDEX idx_sp_loai ON san_pham (loai_ca_id, thu_tu_size);

-- Mot dong = gia cua mot san pham cho mot nhom gia, dang hieu luc hom nay
CREATE TABLE bang_gia (
    san_pham_id TEXT NOT NULL REFERENCES san_pham(id) ON DELETE CASCADE,
    nhom_gia_id TEXT NOT NULL REFERENCES nhom_gia(id) ON DELETE CASCADE,
    bang_gia_id TEXT NOT NULL,          -- ghi vao don de truy vet gia lay tu dau
    gia         INTEGER NOT NULL,       -- dong / don vi
    hieu_luc_tu TEXT NOT NULL,
    hieu_luc_den TEXT,
    PRIMARY KEY (san_pham_id, nhom_gia_id)
) WITHOUT ROWID;

CREATE TABLE khach_hang (
    id               TEXT PRIMARY KEY,
    ma               TEXT,
    ho_ten           TEXT NOT NULL,
    ho_ten_tim       TEXT NOT NULL,     -- FR-KH-05: khong dau, chu thuong
    so_dien_thoai    TEXT,
    dia_chi          TEXT,
    nhom_gia_id      TEXT NOT NULL REFERENCES nhom_gia(id),
    ghi_chu          TEXT
);
CREATE INDEX idx_kh_ten ON khach_hang (ho_ten_tim);
CREATE INDEX idx_kh_sdt ON khach_hang (so_dien_thoai);

-- Tai khoan nhan tien. Giu ca ban ghi da ngung dung de tra cuu don cu.
CREATE TABLE cau_hinh_qr (
    id              TEXT PRIMARY KEY,
    ten_goi_nho     TEXT NOT NULL,
    ngan_hang_bin   TEXT NOT NULL,      -- '970422', dung sinh QR cuc bo
    ngan_hang_ma    TEXT NOT NULL,      -- 'MB'
    ngan_hang_ten   TEXT NOT NULL,
    so_tai_khoan    TEXT NOT NULL,
    ten_chu_tk      TEXT NOT NULL,
    qr_tinh_payload TEXT,               -- QR tinh sinh san, khong kem so tien
    qr_tinh_anh     BLOB,               -- anh PNG luu luon
    dang_dung       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE meta (
    khoa    TEXT PRIMARY KEY,           -- 'bootstrap' | 'may_quay' | 'nguoi_dung'
    gia_tri TEXT NOT NULL,              -- JSON
    tai_luc TEXT NOT NULL
);

-- ===========================================================================
--  B. DON HANG TAO TAI QUAY
-- ===========================================================================

CREATE TABLE don_hang (
    id           TEXT PRIMARY KEY,      -- uuid v7, sinh NGAY khi mo don moi
    ma_don       TEXT NOT NULL UNIQUE,  -- 'POS-20260909-0007'
    may_quay_ma  TEXT NOT NULL,
    nguoi_tao_id TEXT NOT NULL,

    khach_hang_id TEXT,                 -- NULL = khach vang lai
    khach_ten     TEXT,
    khach_sdt     TEXT,
    khach_dia_chi TEXT,

    nhom_gia_id      TEXT NOT NULL,
    nhom_gia_ten     TEXT NOT NULL,     -- snapshot
    la_si            INTEGER NOT NULL,  -- snapshot tu nhom_gia.la_si
    nhom_gia_sua_tay INTEGER NOT NULL DEFAULT 0,

    nguon TEXT NOT NULL DEFAULT 'POS',  -- cho tinh nang dat hang qua dien thoai sau nay

    -- Luu san de thong ke ngay khong phai join chi_tiet (HN-01)
    tong_tien INTEGER NOT NULL DEFAULT 0,   -- dong
    tong_kg   INTEGER NOT NULL DEFAULT 0,   -- gram

    trang_thai      TEXT NOT NULL DEFAULT 'NHAP',
    trang_thai_dong TEXT NOT NULL DEFAULT 'KHONG_CAN',

    trang_thai_tt   TEXT NOT NULL DEFAULT 'CHUA_TRA',
    hinh_thuc_tt    TEXT,
    so_tien_da_nhan INTEGER NOT NULL DEFAULT 0,
    cau_hinh_qr_id  TEXT,
    qr_payload      TEXT,               -- chuoi QR da hien cho khach
    xac_nhan_tt_boi TEXT,
    xac_nhan_tt_luc TEXT,

    ghi_chu   TEXT,
    ly_do_huy TEXT,

    ngay_ban TEXT NOT NULL,             -- 'YYYY-MM-DD', ngay lam viec cua vua

    dat_luc          TEXT NOT NULL,
    xac_nhan_luc     TEXT,
    bat_dau_dong_luc TEXT,
    dong_xong_luc    TEXT,
    hoan_tat_luc     TEXT,
    tao_offline      INTEGER NOT NULL DEFAULT 0,
    da_in_phieu      INTEGER NOT NULL DEFAULT 0,
    lan_sua_cuoi     TEXT,
    so_lan_sua       INTEGER NOT NULL DEFAULT 0,

    CHECK (trang_thai      IN ('NHAP', 'DA_XAC_NHAN', 'HOAN_TAT', 'DA_HUY')),
    CHECK (trang_thai_dong IN ('KHONG_CAN', 'CHO_DONG', 'DANG_DONG', 'DA_DONG')),
    CHECK (trang_thai_tt   IN ('CHUA_TRA', 'DA_TRA')),
    CHECK (hinh_thuc_tt IS NULL OR hinh_thuc_tt IN ('TIEN_MAT', 'CHUYEN_KHOAN')),
    CHECK (trang_thai <> 'DA_HUY' OR ly_do_huy IS NOT NULL),
    CHECK (trang_thai_tt = 'CHUA_TRA' OR hinh_thuc_tt IS NOT NULL),
    CHECK (hinh_thuc_tt IS NOT 'CHUYEN_KHOAN' OR cau_hinh_qr_id IS NOT NULL)
);
CREATE INDEX idx_don_ngay     ON don_hang (ngay_ban, dat_luc DESC);
CREATE INDEX idx_don_khach    ON don_hang (khach_hang_id, ngay_ban DESC);
CREATE INDEX idx_don_hang_doi ON don_hang (dat_luc)
    WHERE trang_thai_dong IN ('CHO_DONG', 'DANG_DONG');
CREATE INDEX idx_don_chua_tra ON don_hang (ngay_ban)
    WHERE trang_thai_tt = 'CHUA_TRA' AND trang_thai <> 'DA_HUY';

CREATE TABLE chi_tiet_don_hang (
    id          TEXT PRIMARY KEY,
    don_hang_id TEXT NOT NULL REFERENCES don_hang(id) ON DELETE CASCADE,
    san_pham_id TEXT NOT NULL,

    -- Snapshot: in lai phieu sau 2 nam van ra dung chu, dung so kg, dung gia
    loai_ca_ten    TEXT NOT NULL,
    size_ca_ten    TEXT NOT NULL,
    don_vi_tinh_id TEXT,
    don_vi_ten     TEXT NOT NULL,       -- 'Thung'
    -- Chup lai he so: sua "thung" tu 25kg thanh 30kg thi don cu van giu 25
    he_so_kg       INTEGER NOT NULL,    -- phan nghin

    -- Ba con so, khong duoc lan lon:
    --   so_luong      = so luong theo DON VI TINH, phan nghin (5 thung -> 5000)
    --   so_kg_du_kien = so_luong x he_so_kg, gram, tu tinh luc dat
    --   so_kg_thuc_te = can lai luc dong hang, gram. NULL = chua can lai.
    so_luong      INTEGER NOT NULL,
    so_kg_du_kien INTEGER NOT NULL,
    so_kg_thuc_te INTEGER,

    don_gia     INTEGER NOT NULL,       -- dong MOI KG, dong bang luc them vao don
    gia_sua_tay INTEGER NOT NULL DEFAULT 0,
    bang_gia_id TEXT,
    -- Ung dung tinh: round(COALESCE(so_kg_thuc_te, so_kg_du_kien) / 1000 * don_gia)
    thanh_tien  INTEGER NOT NULL,

    ghi_chu TEXT,
    thu_tu  INTEGER NOT NULL DEFAULT 0,

    da_dong     INTEGER NOT NULL DEFAULT 0,
    dong_luc    TEXT,
    dong_boi_id TEXT,

    CHECK (so_luong > 0),
    CHECK (so_kg_du_kien > 0),
    CHECK (so_kg_thuc_te IS NULL OR so_kg_thuc_te > 0),
    CHECK (he_so_kg >= 0),
    CHECK (don_gia >= 0)
);
CREATE INDEX idx_ctdh_don ON chi_tiet_don_hang (don_hang_id, thu_tu);

-- Vet sua don. Don si sua duoc o bat ky trang thai nao, doi lai phai luu vet.
CREATE TABLE lich_su_sua_don (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    don_hang_id     TEXT NOT NULL REFERENCES don_hang(id) ON DELETE CASCADE,
    nguoi_dung_id   TEXT,
    ly_do           TEXT NOT NULL,
    trang_thai_luc_sua      TEXT NOT NULL,
    trang_thai_dong_luc_sua TEXT NOT NULL,
    truoc           TEXT NOT NULL,      -- JSON ban chup truoc khi sua
    sau             TEXT NOT NULL,
    tong_tien_truoc INTEGER NOT NULL,
    tong_tien_sau   INTEGER NOT NULL,
    sua_luc         TEXT NOT NULL
);
CREATE INDEX idx_lssd_don ON lich_su_sua_don (don_hang_id, sua_luc DESC);

CREATE TABLE lich_su_trang_thai (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    don_hang_id   TEXT NOT NULL REFERENCES don_hang(id) ON DELETE CASCADE,
    truong        TEXT NOT NULL,
    tu_gia_tri    TEXT,
    sang_gia_tri  TEXT NOT NULL,
    nguoi_dung_id TEXT,
    ghi_chu       TEXT,
    xay_ra_luc    TEXT NOT NULL
);
CREATE INDEX idx_lstt_don ON lich_su_trang_thai (don_hang_id, xay_ra_luc);

-- ===========================================================================
--  C. HANG DOI DONG BO LEN MAY CHU TRUNG TAM
--     May chu dedupe theo don_hang.id nen gui lai bao nhieu lan cung an toan.
--     Don SUA lai sau khi da dong bo -> dat lai trang_thai = 'CHO' de gui ban moi.
-- ===========================================================================
CREATE TABLE outbox (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    don_hang_id  TEXT NOT NULL UNIQUE,
    payload      TEXT NOT NULL,         -- JSON dung dinh dang API
    trang_thai   TEXT NOT NULL DEFAULT 'CHO',
    so_lan_thu   INTEGER NOT NULL DEFAULT 0,
    thu_lai_sau  TEXT,                  -- ISO time, backoff luy thua
    loi_gan_nhat TEXT,
    tao_luc      TEXT NOT NULL,
    gui_xong_luc TEXT,
    CHECK (trang_thai IN ('CHO', 'DANG_GUI', 'THANH_CONG', 'LOI'))
);
CREATE INDEX idx_outbox_cho ON outbox (thu_lai_sau) WHERE trang_thai IN ('CHO', 'LOI');

-- Bo dem so don trong ngay cua may nay, reset moi ngay.
-- Ket hop tien to ma may -> khong the trung so voi may khac du ca hai deu offline.
CREATE TABLE bo_dem_so_don (
    ngay    TEXT PRIMARY KEY,           -- '2026-09-09'
    so_cuoi INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE nhat_ky_ket_noi (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    su_kien    TEXT NOT NULL,           -- 'ONLINE' | 'OFFLINE' | 'SYNC_OK' | 'SYNC_LOI'
    chi_tiet   TEXT,
    xay_ra_luc TEXT NOT NULL
);

-- ===========================================================================
--  D. GHI CHU HIEU NANG PHIA MAY QUAY
--
--  SQLite tren mot may quay chi giu du lieu cua chinh may do. Sau 3 nam van
--  chi khoang vai tram nghin dong -> khong co van de hieu nang neu giu ba dieu:
--
--   1. tong_tien luu san tren don_hang. Thong ke ngay khong JOIN chi_tiet.
--   2. ngay_ban la cot rieng dang 'YYYY-MM-DD'. Loc bang so sanh chuoi truc
--      tiep, khong goi date(dat_luc) trong menh de WHERE (goi ham lam mat index).
--   3. Don da dong bo va cu hon 12 thang thi don sang tep luu tru rieng,
--      giu pos.db nho de sao luu hang ngay cho nhanh.
-- ===========================================================================
