-- ============================================================================
--  POS VUA CA - LUOC DO CO SO DU LIEU MAY CHU TRUNG TAM
--  PostgreSQL 17   |   Bam theo docs/pos/DAC-TA.md v1.1
--
--  Pham vi: luu don hang + thong tin khach dat hang tai quay, man hinh dong
--  hang, thanh toan tien mat / VietQR, thong ke cuoi ngay.
--  KHONG co cong no, ton kho, nhap hang, ca ban.
--
--  Nguyen tac:
--   1. Khoa chinh cua don la UUID sinh tai may quay -> chinh no la idempotency
--      key khi dong bo. Bang KHONG co DEFAULT gen_random_uuid().
--   2. Tien = numeric(18,2), khoi luong = numeric(12,3) (chinh xac toi gram).
--      Khong dung float o bat ky cho nao lien quan den tien hoac can nang.
--   3. Chi tiet don CHUP LAI ten va gia tai thoi diem dat. In lai phieu sau
--      hai nam van ra dung noi dung cua ngay do.
--   4. Hai moc thoi gian: dat_luc (luc khach dat that) va ghi_nhan_luc
--      (luc may chu nhan duoc, co the tre nhieu gio khi quay mat mang).
--   5. Cau hinh co anh huong toi so sach (tai khoan nhan QR) KHONG duoc sua de.
--      Tao ban ghi moi, danh dau ban cu ngung dung.
--   6. Toi uu truy van: xem muc 9 cuoi file.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- EXCLUDE constraint tren bang gia
CREATE EXTENSION IF NOT EXISTS unaccent;    -- tim khach hang khong dau

-- ---------------------------------------------------------------------------
-- 0. KIEU LIET KE
-- ---------------------------------------------------------------------------
CREATE TYPE vai_tro_nd            AS ENUM ('QUAN_TRI', 'NHAN_VIEN');
CREATE TYPE trang_thai_don        AS ENUM ('NHAP', 'DA_XAC_NHAN', 'HOAN_TAT', 'DA_HUY');
CREATE TYPE trang_thai_dong_hang  AS ENUM ('KHONG_CAN', 'CHO_DONG', 'DANG_DONG', 'DA_DONG');
CREATE TYPE trang_thai_thanh_toan AS ENUM ('CHUA_TRA', 'DA_TRA');
CREATE TYPE hinh_thuc_tt          AS ENUM ('TIEN_MAT', 'CHUYEN_KHOAN');
CREATE TYPE nguon_don             AS ENUM ('POS', 'WEB');

-- ---------------------------------------------------------------------------
-- 1. NGUOI DUNG & MAY QUAY
-- ---------------------------------------------------------------------------
CREATE TABLE nguoi_dung (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_dang_nhap  text        NOT NULL UNIQUE,
    mat_khau_hash  text        NOT NULL,               -- argon2id
    ho_ten         text        NOT NULL,
    so_dien_thoai  text,
    vai_tro        vai_tro_nd  NOT NULL DEFAULT 'NHAN_VIEN',
    ma_pin_hash    text,                               -- mo khoa nhanh tai quay, 6 so
    dang_hoat_dong boolean     NOT NULL DEFAULT true,
    tao_luc        timestamptz NOT NULL DEFAULT now()
);

-- Ma may la tien to cua ma don (POS01-20260909-0007) -> hai may cung offline
-- van khong the sinh trung so.
CREATE TABLE may_quay (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    ma               text        NOT NULL UNIQUE,      -- 'POS01'
    ten              text        NOT NULL,
    dang_hoat_dong   boolean     NOT NULL DEFAULT true,
    dong_bo_lan_cuoi timestamptz,
    tao_luc          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE phien_dang_nhap (
    id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoi_dung_id      uuid        NOT NULL REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    may_quay_id        uuid        REFERENCES may_quay(id),
    refresh_token_hash text        NOT NULL UNIQUE,
    het_han_luc        timestamptz NOT NULL,
    thu_hoi_luc        timestamptz,
    tao_luc            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_phien_nguoi_dung ON phien_dang_nhap (nguoi_dung_id) WHERE thu_hoi_luc IS NULL;

-- ---------------------------------------------------------------------------
-- 2. NHOM GIA
--    Thay cho cach phan loai si/le nhi phan cu. Vua ca thuc te co nhieu bac
--    gia si khac nhau: si o gan, si o xa, si than thiet...
--    Them mot bac gia moi = them mot dong, khong sua lai lieu do.
-- ---------------------------------------------------------------------------
CREATE TABLE nhom_gia (
    id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    ma         text    NOT NULL UNIQUE,       -- 'LE', 'SI_GAN', 'SI_XA', 'SI_VIP'
    ten        text    NOT NULL,              -- 'Le', 'Si o gan', 'Si o xa', 'Si than thiet'
    -- Quyet dinh don co phai di qua buoc dong hang hay khong (FR-DG-01)
    la_si      boolean NOT NULL,
    thu_tu     integer NOT NULL DEFAULT 0,
    la_mac_dinh boolean NOT NULL DEFAULT false,
    ghi_chu    text,
    da_xoa     boolean NOT NULL DEFAULT false
);
-- Dung mot nhom gia mac dinh duy nhat (dung cho khach vang lai).
-- Partial unique index tren chinh cot boolean: chi co the ton tai mot dong true.
CREATE UNIQUE INDEX idx_mot_nhom_gia_mac_dinh
    ON nhom_gia (la_mac_dinh) WHERE la_mac_dinh;

INSERT INTO nhom_gia (ma, ten, la_si, thu_tu, la_mac_dinh) VALUES
    ('LE',     'Le',            false, 1, true),
    ('SI_GAN', 'Si o gan',      true,  2, false),
    ('SI_XA',  'Si o xa',       true,  3, false),
    ('SI_VIP', 'Si than thiet', true,  4, false);

-- ---------------------------------------------------------------------------
-- 3. DANH MUC HANG HOA
-- ---------------------------------------------------------------------------
CREATE TABLE loai_ca (
    id      uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    ma      text    NOT NULL UNIQUE,
    ten     text    NOT NULL,
    anh_url text,
    mo_ta   text,
    da_xoa  boolean NOT NULL DEFAULT false
);

CREATE TABLE size_ca (
    id     uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    ten    text    NOT NULL UNIQUE,
    thu_tu integer NOT NULL DEFAULT 0,
    da_xoa boolean NOT NULL DEFAULT false
);

-- Don vi tinh + HE SO QUY DOI KG (giu dung mo hinh cua project cu: cot
-- donvitinh.hesokg). Khach goi hang theo thung / con / kg, nhung GIA luon
-- tinh theo KG -> phai quy doi.
--   he_so_kg = 0  -> khong quy doi duoc, nhan vien nhap so kg bang tay
--   he_so_kg > 0  -> so kg tu tinh, o nhap kg bi khoa (FR-DH-07)
CREATE TABLE don_vi_tinh (
    id       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    ma       text          NOT NULL UNIQUE,        -- 'KG', 'CON', 'THUNG'
    ten      text          NOT NULL,
    he_so_kg numeric(12,3) NOT NULL DEFAULT 0 CHECK (he_so_kg >= 0),
    ghi_chu  text,
    da_xoa   boolean       NOT NULL DEFAULT false
);

CREATE TABLE san_pham (
    id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_sku     text    NOT NULL UNIQUE,
    loai_ca_id uuid    NOT NULL REFERENCES loai_ca(id),
    size_ca_id uuid    NOT NULL REFERENCES size_ca(id),
    -- Chi la goi y dien san khi them dong hang. Don vi tinh THAT SU cua tung
    -- dong do nhan vien chon luc dat, vi cung mot loai ca co the ban theo
    -- thung cho khach si va theo kg cho khach le.
    don_vi_tinh_mac_dinh_id uuid REFERENCES don_vi_tinh(id),
    da_xoa     boolean NOT NULL DEFAULT false,
    UNIQUE (loai_ca_id, size_ca_id)
);

-- ---------------------------------------------------------------------------
-- 4. BANG GIA
--    Mot dong = gia cua MOT san pham cho MOT nhom gia trong MOT khoang ngay.
--    Gia ca o vua thay doi gan nhu hang ngay -> bang nay lon nhanh nhat he
--    thong, nhung van rat nho: 20 san pham x 4 nhom x 365 ngay ~ 29.000 dong/nam.
-- ---------------------------------------------------------------------------
CREATE TABLE bang_gia (
    id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    san_pham_id uuid          NOT NULL REFERENCES san_pham(id),
    nhom_gia_id uuid          NOT NULL REFERENCES nhom_gia(id),
    gia         numeric(18,2) NOT NULL CHECK (gia >= 0),
    hieu_luc    daterange     NOT NULL,   -- '[2026-09-09,)' = tu ngay do, chua het han
    tao_boi     uuid          REFERENCES nguoi_dung(id),
    tao_luc     timestamptz   NOT NULL DEFAULT now(),
    -- FR-DM-04: DB tu chan hai bang gia chong lan ngay cua cung mot
    -- (san pham, nhom gia). Khong the sai du bao nhieu nguoi sua gia cung luc.
    CONSTRAINT bang_gia_khong_chong_lan
        EXCLUDE USING gist (san_pham_id WITH =, nhom_gia_id WITH =, hieu_luc WITH &&)
);
-- Truy van nong: lay toan bo gia hieu luc hom nay cho mot nhom gia
CREATE INDEX idx_bang_gia_tra_cuu ON bang_gia (nhom_gia_id, san_pham_id)
    INCLUDE (gia);

-- ---------------------------------------------------------------------------
-- 5. KHACH HANG
-- ---------------------------------------------------------------------------

-- unaccent() mac dinh la STABLE nen KHONG dung truc tiep trong index duoc.
-- Dang hai tham so (chi ro tu dien) moi la IMMUTABLE -> boc lai thanh ham
-- rieng de lam index tim kiem khong dau. Day la cach lam chinh thuc trong
-- tai lieu Postgres, khong phai meo.
CREATE FUNCTION khong_dau(text) RETURNS text AS $$
    SELECT lower(public.unaccent('public.unaccent', $1))
$$ LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE;

CREATE TABLE khach_hang (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    ma            text        UNIQUE,
    ho_ten        text        NOT NULL,
    so_dien_thoai text,
    dia_chi       text,
    nhom_gia_id   uuid        NOT NULL REFERENCES nhom_gia(id),
    ghi_chu       text,
    da_xoa        boolean     NOT NULL DEFAULT false,
    tao_luc       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_khach_sdt ON khach_hang (so_dien_thoai)
    WHERE so_dien_thoai IS NOT NULL AND da_xoa = false;
-- FR-KH-05: tim theo ten khong dau, khong phan biet hoa thuong.
-- Truy van phai viet dung dang nay moi trung index:
--   WHERE khong_dau(ho_ten) LIKE khong_dau($1) || '%'
CREATE INDEX idx_khach_ten_khong_dau
    ON khach_hang (khong_dau(ho_ten) text_pattern_ops) WHERE da_xoa = false;
CREATE INDEX idx_khach_nhom_gia ON khach_hang (nhom_gia_id) WHERE da_xoa = false;

-- ---------------------------------------------------------------------------
-- 6. CAU HINH QR NHAN TIEN
--    KHONG BAO GIO sua de hoac xoa. Doi tai khoan = them dong moi, danh dau
--    dong cu ngung dung. Don cu van tro toi cau hinh cu -> tra so sach nam
--    ngoai van ra dung tai khoan da nhan tien.
-- ---------------------------------------------------------------------------
CREATE TABLE cau_hinh_qr (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_goi_nho     text        NOT NULL,          -- 'MB - tai khoan chinh'
    ngan_hang_bin   text        NOT NULL,          -- '970422', 6 chu so, dung sinh QR
    ngan_hang_ma    text        NOT NULL,          -- 'MB', dung cho quick link neu can
    ngan_hang_ten   text        NOT NULL,          -- 'Ngan hang Quan doi'
    so_tai_khoan    text        NOT NULL,
    ten_chu_tk      text        NOT NULL,          -- khong dau, in hoa
    -- QR TINH (khong kem so tien) sinh san mot lan va luu luon, dung khi can
    -- in dan tai quay hoac lam phuong an du phong
    qr_tinh_payload text,                          -- chuoi EMVCo
    qr_tinh_anh     bytea,                         -- anh PNG
    dang_dung       boolean     NOT NULL DEFAULT true,
    tao_boi         uuid        REFERENCES nguoi_dung(id),
    tao_luc         timestamptz NOT NULL DEFAULT now(),
    ngung_dung_luc  timestamptz,
    CONSTRAINT bin_6_chu_so CHECK (ngan_hang_bin ~ '^[0-9]{6}$'),
    CONSTRAINT ngung_dung_phai_co_moc
        CHECK (dang_dung OR ngung_dung_luc IS NOT NULL)
);
-- Dung mot cau hinh dang dung tai mot thoi diem
CREATE UNIQUE INDEX idx_mot_cau_hinh_qr
    ON cau_hinh_qr (dang_dung) WHERE dang_dung;

-- ---------------------------------------------------------------------------
-- 7. DON HANG
-- ---------------------------------------------------------------------------
CREATE TABLE don_hang (
    -- KHONG co DEFAULT: id do may quay sinh (uuid v7) truoc khi goi API.
    -- Chinh no la idempotency key -> gui lai 10 lan van chi 1 don.
    id           uuid PRIMARY KEY,
    ma_don       text NOT NULL UNIQUE,   -- 'POS01-20260909-0007'
    may_quay_id  uuid REFERENCES may_quay(id),
    nguoi_tao_id uuid REFERENCES nguoi_dung(id),

    -- Khach hang. NULL = khach vang lai
    khach_hang_id uuid REFERENCES khach_hang(id),
    -- Chup lai, khong join nguoc ve khach_hang khi in lai phieu
    khach_ten     text,
    khach_sdt     text,
    khach_dia_chi text,

    -- Nhom gia ap cho don, kem ban chup de bao cao cu khong doi khi doi ten nhom
    nhom_gia_id      uuid    NOT NULL REFERENCES nhom_gia(id),
    nhom_gia_ten     text    NOT NULL,
    la_si            boolean NOT NULL,   -- chup tu nhom_gia.la_si luc dat
    nhom_gia_sua_tay boolean NOT NULL DEFAULT false,
    nhom_gia_sua_boi uuid    REFERENCES nguoi_dung(id),
    nhom_gia_sua_luc timestamptz,

    -- Nguon tao don. Ban nay chi co POS; WEB chua tro cho tinh nang dat hang
    -- bang dien thoai sau nay (DAC-TA §7.4) de khong phai sua du lieu cu.
    nguon nguon_don NOT NULL DEFAULT 'POS',

    -- HN-01: tong_tien va tong_kg luu san. Thong ke ngay chi doc bang nay,
    -- KHONG BAO GIO join chi_tiet_don_hang. Day la quyet dinh quan trong
    -- nhat ve hieu nang trong ca lieu do.
    tong_tien numeric(18,2) NOT NULL DEFAULT 0 CHECK (tong_tien >= 0),
    tong_kg   numeric(12,3) NOT NULL DEFAULT 0 CHECK (tong_kg >= 0),

    trang_thai      trang_thai_don       NOT NULL DEFAULT 'NHAP',
    trang_thai_dong trang_thai_dong_hang NOT NULL DEFAULT 'KHONG_CAN',

    -- Thanh toan. Khach le: don chi duoc tao SAU khi nhan vien xac nhan da
    -- nhan tien, nen sinh ra da la DA_TRA. Khach si tra sau -> CHUA_TRA.
    trang_thai_tt    trang_thai_thanh_toan NOT NULL DEFAULT 'CHUA_TRA',
    hinh_thuc_tt     hinh_thuc_tt,
    so_tien_da_nhan  numeric(18,2) NOT NULL DEFAULT 0 CHECK (so_tien_da_nhan >= 0),
    -- Chenh lech phat sinh khi sua don SAU khi da thu tien (FR-SD-04)
    chenh_lech_tt    numeric(18,2) GENERATED ALWAYS AS (so_tien_da_nhan - tong_tien) STORED,
    cau_hinh_qr_id   uuid REFERENCES cau_hinh_qr(id),  -- tai khoan da nhan tien
    qr_payload       text,                             -- chuoi QR da hien cho khach
    xac_nhan_tt_boi  uuid REFERENCES nguoi_dung(id),   -- AI bam "da nhan tien"
    xac_nhan_tt_luc  timestamptz,

    ghi_chu   text,
    ly_do_huy text,

    -- Ngay ban theo lich lam viec cua vua, do may quay ghi vao.
    -- KHONG suy ra tu dat_luc: vua co the lam qua nua dem, va ep kieu
    -- timestamptz sang date phu thuoc mui gio phien nen khong dung duoc index.
    ngay_ban date NOT NULL,

    dat_luc          timestamptz NOT NULL,
    xac_nhan_luc     timestamptz,
    bat_dau_dong_luc timestamptz,
    dong_xong_luc    timestamptz,
    hoan_tat_luc     timestamptz,
    ghi_nhan_luc     timestamptz NOT NULL DEFAULT now(),
    tao_offline      boolean     NOT NULL DEFAULT false,
    lan_sua_cuoi     timestamptz,
    so_lan_sua       integer     NOT NULL DEFAULT 0,

    CONSTRAINT huy_phai_co_ly_do
        CHECK (trang_thai <> 'DA_HUY' OR ly_do_huy IS NOT NULL),
    CONSTRAINT da_tra_phai_co_hinh_thuc
        CHECK (trang_thai_tt = 'CHUA_TRA' OR hinh_thuc_tt IS NOT NULL),
    -- Tra bang chuyen khoan thi phai biet vao tai khoan nao
    CONSTRAINT ck_phai_co_tai_khoan
        CHECK (hinh_thuc_tt IS DISTINCT FROM 'CHUYEN_KHOAN' OR cau_hinh_qr_id IS NOT NULL),
    CONSTRAINT xac_nhan_tt_phai_co_nguoi
        CHECK (trang_thai_tt = 'CHUA_TRA' OR xac_nhan_tt_boi IS NOT NULL)
);

-- ---------------------------------------------------------------------------
-- 7b. CHI SO CUA don_hang
--     Bon truy van chiem gan het tai: hang doi dong hang, danh sach don trong
--     ngay, thong ke ngay, tra cuu theo khach.
-- ---------------------------------------------------------------------------

-- Hang doi dong hang. Partial index: chi vai chuc dong tai mot thoi diem,
-- nam gon trong RAM, khong phinh theo lich su.
CREATE INDEX idx_don_hang_doi ON don_hang (dat_luc)
    WHERE trang_thai_dong IN ('CHO_DONG', 'DANG_DONG');

-- Danh sach don trong ngay (man hinh mac dinh)
CREATE INDEX idx_don_ngay ON don_hang (ngay_ban, dat_luc DESC);

-- Thong ke doanh thu ngay. INCLUDE de Postgres cong tong hoan toan tren
-- index, khong doc bang chinh mot lan nao (index-only scan).
CREATE INDEX idx_don_thong_ke ON don_hang (ngay_ban)
    INCLUDE (tong_tien, tong_kg, trang_thai_tt, hinh_thuc_tt, la_si)
    WHERE trang_thai <> 'DA_HUY';

-- Tra cuu lich su theo khach
CREATE INDEX idx_don_khach ON don_hang (khach_hang_id, ngay_ban DESC)
    WHERE khach_hang_id IS NOT NULL;

-- Tim theo so dien thoai khach vang lai
CREATE INDEX idx_don_sdt ON don_hang (khach_sdt) WHERE khach_sdt IS NOT NULL;

-- Don si chua thu tien
CREATE INDEX idx_don_chua_tra ON don_hang (ngay_ban)
    WHERE trang_thai_tt = 'CHUA_TRA' AND trang_thai <> 'DA_HUY';

-- ---------------------------------------------------------------------------
-- 8. CHI TIET DON HANG
-- ---------------------------------------------------------------------------
CREATE TABLE chi_tiet_don_hang (
    id          uuid PRIMARY KEY,
    don_hang_id uuid NOT NULL REFERENCES don_hang(id) ON DELETE CASCADE,
    san_pham_id uuid NOT NULL REFERENCES san_pham(id),

    -- SNAPSHOT: in lai phieu sau 2 nam van ra dung chu, dung gia, dung so kg
    loai_ca_ten text NOT NULL,
    size_ca_ten text NOT NULL,
    don_vi_tinh_id uuid REFERENCES don_vi_tinh(id),
    don_vi_ten  text NOT NULL,              -- 'Thung'
    -- Chup lai he so: sua "thung" tu 25kg thanh 30kg thi don cu van giu 25.
    he_so_kg    numeric(12,3) NOT NULL CHECK (he_so_kg >= 0),

    -- Ba con so, khong duoc lan lon:
    --   so_luong       = so luong theo DON VI TINH (5 thung)
    --   so_kg_du_kien  = so_luong x he_so_kg, tu tinh luc dat (FR-DH-06)
    --   so_kg_thuc_te  = can lai luc dong hang. NULL = chua can lai.
    so_luong      numeric(12,3) NOT NULL CHECK (so_luong > 0),
    so_kg_du_kien numeric(12,3) NOT NULL CHECK (so_kg_du_kien > 0),
    so_kg_thuc_te numeric(12,3) CHECK (so_kg_thuc_te > 0),

    -- Don gia la GIA MOI KG, khong phai gia moi don vi tinh
    don_gia     numeric(18,2) NOT NULL CHECK (don_gia >= 0),
    gia_sua_tay boolean NOT NULL DEFAULT false,
    bang_gia_id uuid REFERENCES bang_gia(id),

    -- So kg dung de tinh tien: can lai neu co, khong thi lay du kien
    so_kg_tinh_tien numeric(12,3) GENERATED ALWAYS AS
        (coalesce(so_kg_thuc_te, so_kg_du_kien)) STORED,
    thanh_tien numeric(18,2) GENERATED ALWAYS AS
        (round(coalesce(so_kg_thuc_te, so_kg_du_kien) * don_gia, 2)) STORED,

    ghi_chu text,
    thu_tu  integer NOT NULL DEFAULT 0,

    da_dong     boolean NOT NULL DEFAULT false,
    dong_luc    timestamptz,
    dong_boi_id uuid REFERENCES nguoi_dung(id)
);
CREATE INDEX idx_ctdh_don     ON chi_tiet_don_hang (don_hang_id, thu_tu);
CREATE INDEX idx_ctdh_sanpham ON chi_tiet_don_hang (san_pham_id);

-- ---------------------------------------------------------------------------
-- 8b. VET SUA DON
--     Don si sua duoc o BAT KY trang thai nao (FR-SD-01), ke ca sau khi da
--     dong xong va da thu tien. Doi lai, moi lan sua phai luu ban chup truoc
--     va sau. Day la thu duy nhat giup doi chieu khi sai sot.
-- ---------------------------------------------------------------------------
CREATE TABLE lich_su_sua_don (
    id              bigserial   PRIMARY KEY,
    don_hang_id     uuid        NOT NULL REFERENCES don_hang(id) ON DELETE CASCADE,
    nguoi_dung_id   uuid        REFERENCES nguoi_dung(id),
    ly_do           text        NOT NULL,
    trang_thai_luc_sua      trang_thai_don       NOT NULL,
    trang_thai_dong_luc_sua trang_thai_dong_hang NOT NULL,
    truoc           jsonb       NOT NULL,   -- ban chup don + chi tiet truoc khi sua
    sau             jsonb       NOT NULL,
    tong_tien_truoc numeric(18,2) NOT NULL,
    tong_tien_sau   numeric(18,2) NOT NULL,
    sua_luc         timestamptz NOT NULL
);
-- Chi index cot tra cuu. KHONG index toan bo jsonb: bang nay phinh nhanh
-- va khong ai truy van vao ruot ban chup.
CREATE INDEX idx_lssd_don   ON lich_su_sua_don (don_hang_id, sua_luc DESC);
CREATE INDEX idx_lssd_ngay  ON lich_su_sua_don (sua_luc DESC);

CREATE TABLE lich_su_trang_thai (
    id            bigserial   PRIMARY KEY,
    don_hang_id   uuid        NOT NULL REFERENCES don_hang(id) ON DELETE CASCADE,
    truong        text        NOT NULL,
    tu_gia_tri    text,
    sang_gia_tri  text        NOT NULL,
    nguoi_dung_id uuid        REFERENCES nguoi_dung(id),
    ghi_chu       text,
    xay_ra_luc    timestamptz NOT NULL
);
CREATE INDEX idx_lstt_don ON lich_su_trang_thai (don_hang_id, xay_ra_luc);

-- ---------------------------------------------------------------------------
-- 8c. NHAT KY DONG BO
-- ---------------------------------------------------------------------------
CREATE TABLE nhat_ky_dong_bo (
    id          bigserial   PRIMARY KEY,
    may_quay_id uuid        REFERENCES may_quay(id),
    don_hang_id uuid,
    ket_qua     text        NOT NULL,   -- 'THANH_CONG' | 'TRUNG_LAP' | 'LOI'
    thong_bao   text,
    payload     jsonb,
    nhan_luc    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sync_loi ON nhat_ky_dong_bo (nhan_luc DESC) WHERE ket_qua = 'LOI';

-- ---------------------------------------------------------------------------
-- 9. VIEW
-- ---------------------------------------------------------------------------

-- Gia dang ap dung hom nay cho tung (san pham, nhom gia).
-- Dung cho man hinh ban va cho goi bootstrap tai ve may quay.
CREATE VIEW gia_hien_hanh AS
SELECT sp.id AS san_pham_id,
       sp.ma_sku,
       lc.ten AS loai_ca_ten,
       sc.ten AS size_ca_ten,
       sc.thu_tu,
       dv.id  AS don_vi_mac_dinh_id,
       dv.ten AS don_vi_mac_dinh_ten,
       dv.he_so_kg AS he_so_kg_mac_dinh,
       ng.id  AS nhom_gia_id,
       ng.ma  AS nhom_gia_ma,
       ng.la_si,
       bg.id  AS bang_gia_id,
       bg.gia
FROM san_pham sp
JOIN loai_ca lc     ON lc.id = sp.loai_ca_id
JOIN size_ca sc     ON sc.id = sp.size_ca_id
LEFT JOIN don_vi_tinh dv ON dv.id = sp.don_vi_tinh_mac_dinh_id
CROSS JOIN nhom_gia ng
LEFT JOIN bang_gia bg
       ON bg.san_pham_id = sp.id
      AND bg.nhom_gia_id = ng.id
      AND bg.hieu_luc @> CURRENT_DATE
WHERE sp.da_xoa = false AND ng.da_xoa = false;

-- FR-DG-03/04: MOT bang phang, moi dong hang la mot dong, kem san thong tin
-- don de giao dien gop o (rowspan). Lay het bang DUNG MOT truy van (HN-06),
-- khong lap vong goi tung don.
--
-- KHONG co cot tien (FR-DG-10).
-- ma_don van tra ve de lam khoa va de tra cuu, nhung KHONG hien tren bang
-- (FR-DG-04b): nhan vien dong hang nhan biet don bang TEN KHACH.
CREATE VIEW bang_dong_hang AS
SELECT dh.id            AS don_hang_id,
       dh.ma_don,
       coalesce(dh.khach_ten, 'Khach vang lai') AS khach_ten,
       dh.khach_sdt,
       dh.nhom_gia_ten,
       dh.ghi_chu       AS ghi_chu_don,
       dh.dat_luc,
       dh.trang_thai_dong,
       (now() - dh.dat_luc) > interval '30 minutes' AS cho_qua_lau,
       ct.id            AS dong_id,
       ct.thu_tu,
       ct.loai_ca_ten,
       ct.size_ca_ten,
       ct.don_vi_ten,
       ct.so_luong,
       ct.so_kg_du_kien,
       ct.so_kg_thuc_te,
       ct.ghi_chu       AS ghi_chu_dong,
       ct.da_dong
FROM don_hang dh
JOIN chi_tiet_don_hang ct ON ct.don_hang_id = dh.id
WHERE dh.trang_thai_dong IN ('CHO_DONG', 'DANG_DONG')
  AND dh.trang_thai = 'DA_XAC_NHAN'
ORDER BY dh.dat_luc, ct.thu_tu;

-- FR-DG-13: o dem o dau bang
CREATE VIEW tong_quan_dong_hang AS
SELECT count(DISTINCT dh.id)                    AS so_don_cho,
       count(ct.id)                             AS so_mat_hang,
       count(ct.id) FILTER (WHERE ct.da_dong)   AS so_mat_hang_da_dong,
       sum(coalesce(ct.so_kg_thuc_te, ct.so_kg_du_kien)) AS tong_kg
FROM don_hang dh
JOIN chi_tiet_don_hang ct ON ct.don_hang_id = dh.id
WHERE dh.trang_thai_dong IN ('CHO_DONG', 'DANG_DONG')
  AND dh.trang_thai = 'DA_XAC_NHAN';

-- Thong ke cuoi ngay (FR-TK-01). Doc duoc bang index-only scan tren
-- idx_don_thong_ke -> nhanh nhu nhau du bang co 10 hay 10 trieu dong.
CREATE VIEW thong_ke_ngay AS
SELECT ngay_ban,
       count(*)                                                    AS so_don,
       sum(tong_tien)                                              AS tong_doanh_thu,
       sum(tong_kg)                                                AS tong_kg_da_ban,
       count(*) FILTER (WHERE la_si)                               AS so_don_si,
       count(*) FILTER (WHERE NOT la_si)                           AS so_don_le,
       sum(tong_tien) FILTER (WHERE hinh_thuc_tt = 'TIEN_MAT')     AS thu_tien_mat,
       sum(tong_tien) FILTER (WHERE hinh_thuc_tt = 'CHUYEN_KHOAN') AS thu_chuyen_khoan,
       sum(tong_tien) FILTER (WHERE trang_thai_tt = 'CHUA_TRA')    AS chua_thu
FROM don_hang
WHERE trang_thai <> 'DA_HUY'
GROUP BY ngay_ban;

-- ---------------------------------------------------------------------------
-- 10. GHI CHU VE HIEU NANG
--
-- Quy mo thuc te: gia su 300 don/ngay, moi don 5 dong chi tiet
--   -> ~110.000 don va ~550.000 dong chi tiet MOI NAM.
-- O co nay Postgres khong can toi phan vung bang hay materialized view.
-- Cham hay khong nam o bon thu duoi day, khong nam o kich thuoc du lieu:
--
--  1. tong_tien luu san tren don_hang.
--     Thong ke ngay chi doc don_hang, khong bao gio JOIN chi_tiet_don_hang.
--     Day la thu quan trong nhat trong ca file nay ve mat hieu nang.
--
--  2. ngay_ban la cot date rieng, do ung dung ghi.
--     Loc bang "WHERE ngay_ban = '2026-09-09'" dung duoc index.
--     Neu loc bang "WHERE dat_luc::date = ..." thi Postgres phai quet
--     toan bang, va ket qua con phu thuoc mui gio cua phien ket noi.
--
--  3. Partial index cho hang doi dong hang va don chua tra.
--     Hai truy van nay chay lien tuc suot ngay nhung chi cham vai chuc dong.
--     Partial index giu chung nho mai mai, khong phinh theo lich su.
--
--  4. Tranh N+1 o tang ung dung.
--     Lay chi tiet cua nhieu don bang MOT truy van
--       WHERE don_hang_id = ANY($1)
--     chu khong lap vong goi tung don. Day moi la nguyen nhan cham pho bien
--     nhat trong thuc te, va khong co index nao cuu duoc.
--
-- Khi nao moi can lam them:
--   > 5 trieu dong don_hang  -> phan vung theo nam (PARTITION BY RANGE)
--   > 2 giay cho bao cao nam -> them bang tong hop thong_ke_ngay ghi san
--   Truoc nguong do, them gi cung chi la phuc tap hoa vo ich.
-- ---------------------------------------------------------------------------
