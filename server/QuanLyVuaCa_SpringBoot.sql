-- 1. Tạo database
CREATE DATABASE IF NOT EXISTS QuanLyVuaCa;
USE QuanLyVuaCa;

CREATE TABLE vaitro (
    idvaitro INT PRIMARY KEY AUTO_INCREMENT,
    tenvaitro VARCHAR(50) NOT NULL
);

CREATE TABLE taikhoan (
    idtaikhoan VARCHAR(36) PRIMARY KEY,
    idvaitro INT NOT NULL,
    ho VARCHAR(50),
    ten VARCHAR(10),
    matkhau VARCHAR(36),
    email VARCHAR(50),
    sodienthoai VARCHAR(15),
    diachi VARCHAR(80),
    trangthaitk ENUM('HOAT_DONG', 'KHOA') DEFAULT 'HOAT_DONG',
    FOREIGN KEY (idvaitro) REFERENCES vaitro(idvaitro)
);

CREATE TABLE nhacungcap (
    idncc INT PRIMARY KEY AUTO_INCREMENT,
    tenncc VARCHAR(60),
    sodienthoai VARCHAR(15)
);

CREATE TABLE loaica (
    idloaica INT PRIMARY KEY AUTO_INCREMENT,
    tenloaica VARCHAR(60)
);

CREATE TABLE sizeca (
    idsizeca INT PRIMARY KEY AUTO_INCREMENT,
    idloaica INT NOT NULL,
    sizeca VARCHAR(20),
    FOREIGN KEY (idloaica) REFERENCES loaica(idloaica)
);

CREATE TABLE chitietcaban (
    idchitietcaban INT PRIMARY KEY AUTO_INCREMENT,
    idloaica INT NOT NULL,
    idsizeca INT NOT NULL,
    soluongton DECIMAL(10,2),
    FOREIGN KEY (idloaica) REFERENCES loaica(idloaica),
    FOREIGN KEY (idsizeca) REFERENCES sizeca(idsizeca)
);

CREATE TABLE quydoi (
    idquydoi INT PRIMARY KEY AUTO_INCREMENT,
    idchitietcaban INT NOT NULL,
    sokgtuongung DECIMAL(10,2),
    FOREIGN KEY (idchitietcaban) REFERENCES chitietcaban(idchitietcaban)
);

CREATE TABLE donvitinh (
    iddvt INT PRIMARY KEY AUTO_INCREMENT,
    tendvt VARCHAR(20),
    hesokg DECIMAL(10,2),
    ghichu VARCHAR(50)
);

CREATE TABLE donhang (
    iddonhang VARCHAR(36) PRIMARY KEY,
    idthongtinkhachhang VARCHAR(36),
    ngaydat DATETIME,
    trangthaidonhang ENUM('CHO_XAC_NHAN', 'DANG_DONG_HANG', 'DANG_VAN_CHUYEN', 'HOAN_TAT', 'HUY') DEFAULT 'CHO_XAC_NHAN'
);

CREATE TABLE chitietdonhang (
    idchitietdonhang VARCHAR(36) PRIMARY KEY,
    iddonhang VARCHAR(36) NOT NULL,
    idchitietcaban INT NOT NULL,
    iddonvitinh INT NOT NULL,
    soluong INT,
    soluongkgthucte DECIMAL(12,2),
    soluongkgthuctequydoi DECIMAL(12,2),
    tongtiendukien DECIMAL(12,2),
    tongtienthucte DECIMAL(12,2),
    FOREIGN KEY (iddonhang) REFERENCES donhang(iddonhang),
    FOREIGN KEY (idchitietcaban) REFERENCES chitietcaban(idchitietcaban),
    FOREIGN KEY (iddonvitinh) REFERENCES donvitinh(iddvt)
);

CREATE TABLE banggia (
    idbanggia INT PRIMARY KEY AUTO_INCREMENT,
    idchitietcaban INT NOT NULL,
    idloaikhachhang INT,
    giabanle DECIMAL(18,2),
    giabansi DECIMAL(18,2),
    ngaybatdau DATE,
    ngayketthuc DATE,
    FOREIGN KEY (idchitietcaban) REFERENCES chitietcaban(idchitietcaban)
);

CREATE TABLE phieunhap (
    idphieunhap VARCHAR(36) PRIMARY KEY,
    idncc INT,
    idnguoitaophieu VARCHAR(36),
    idloaica INT,
    ngaynhap DATE,
    tongsoluong DECIMAL(12,2),
    trangthaithanhtoan ENUM('CHUA_THANH_TOAN','DA_THANH_TOAN'),
    ghichu VARCHAR(100),
    
    FOREIGN KEY (idncc) REFERENCES nhacungcap(idncc),
    FOREIGN KEY (idnguoitaophieu) REFERENCES taikhoan(idtaikhoan),
    -- Đã bổ sung dòng này để an toàn dữ liệu
    FOREIGN KEY (idloaica) REFERENCES loaica(idloaica) 
);

CREATE TABLE chitietphieunhap (
    idchitietphieunhap VARCHAR(36) PRIMARY KEY,
    idphieunhap VARCHAR(36),
    idchitietcaban INT,
    soluongnhap DECIMAL(12,2),
    soluongton DECIMAL(12,2),
    gianhap DECIMAL(10,2),
    giabantaithoidiemnhap DECIMAL(10,2),
    trangthaica ENUM('CON_HANG', 'HET_HANG', 'THANH_LY'),
    ngaythanhly DATE,
    FOREIGN KEY (idphieunhap) REFERENCES phieunhap(idphieunhap),
    FOREIGN KEY (idchitietcaban) REFERENCES chitietcaban(idchitietcaban)
);

CREATE TABLE phieuthanhly (
    idphieuthanhly VARCHAR(36) PRIMARY KEY,
    idnguoitaophieu VARCHAR(36),
    ngaythanhly DATETIME,
    lydothanhly VARCHAR(50),
    ghichu VARCHAR(50),
    FOREIGN KEY (idnguoitaophieu) REFERENCES taikhoan(idtaikhoan)
);

CREATE TABLE chitietphieuthanhly (
    idchitietphieuthanhly VARCHAR(36) PRIMARY KEY,
    idphieuthanhly VARCHAR(36),
    idchitietcaban INT,
    soluongthanhly DECIMAL(12,2),
    dongia DECIMAL(10,2),
    thanhtien DECIMAL(12,2),
    FOREIGN KEY (idphieuthanhly) REFERENCES phieuthanhly(idphieuthanhly),
    FOREIGN KEY (idchitietcaban) REFERENCES chitietcaban(idchitietcaban)
);



-- 1. Tắt kiểm tra khóa ngoại để tránh lỗi
-- SET FOREIGN_KEY_CHECKS = 0;

-- 2. Xóa các bảng KHÔNG có chữ 'payment'
-- DROP TABLE IF EXISTS 
--     banggia, 
--     chitietcaban, 
--     nhacungcap, 
--     loaica, 
--     donvitinh, 
--     donhang, 
--     chitietphieuthanhly, 
--     chitietphieunhap, 
--     chitietdonhang, 
--     phieunhap, 
--     phieuthanhly, 
--     quydoi, 
--     sizeca, 
--     taikhoan, 
--     vaitro;

-- 3. Bật lại kiểm tra khóa ngoại
-- SET FOREIGN_KEY_CHECKS = 1;


    ALTER TABLE loaica
    ADD COLUMN mieuta VARCHAR(255);
    
	ALTER TABLE loaica
    ADD COLUMN hinhanhurl VARCHAR(255);