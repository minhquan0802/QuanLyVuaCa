USE QuanLyVuaCa;

-- Tắt kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 1. DANH MỤC CÁ & SIZE
-- =============================================

-- Bảng: loaica
TRUNCATE TABLE loaica;
INSERT INTO loaica (idLoaiCa, tenLoaiCa, mieuta, hinhanhurl) VALUES 
(1, 'Cá Điêu Hồng', 'Thịt trắng, ngọt, ít xương dăm, da màu đỏ hồng đẹp mắt. Thường dùng để hấp xì dầu, nấu lẩu hoặc chiên xù.', 'ca-dieu-hong.jpg'),
(2, 'Cá Lóc', 'Hay còn gọi là cá quả, thịt chắc, ngọt và lành tính. Rất phổ biến và ngon nhất với món kho tộ hoặc nấu canh chua.', 'ca-loc.jpg'),
(3, 'Cá Chép', 'Loài cá nước ngọt truyền thống, thịt dày và béo. Thường được chế biến món cá chép om dưa, kho riềng hoặc nấu cháo.', 'ca-chep.jpg'),
(4, 'Cá Trắm', 'Kích thước lớn, thịt chắc, thớ thịt to và thơm ngon. Đặc biệt ngon khi kho, hấp bia hoặc làm gỏi cá.', 'ca-tram.jpg'),
(5, 'Cá Rô', 'Loại cá dân dã, tuy có xương nhưng thịt rất thơm, béo và ngọt đậm đà. Thường dùng chiên giòn hoặc nấu canh rau cải.', 'ca-ro.jpg');

-- Bảng: sizeca
TRUNCATE TABLE sizeca;
INSERT INTO sizeca (idSizeCa, idLoaiCa, sizeCa) VALUES 
(1, 1, 'Size 0.8 - 1kg'),  
(2, 1, 'Size > 1.2kg'),    
(3, 2, 'Size Nhất (To)'),  
(4, 2, 'Size Nhì (Vừa)'),  
(5, 3, 'Size 2-3kg'),      
(6, 5, 'Size 3-4 ngón');   

-- =============================================
-- 2. KHO HÀNG & GIÁ
-- =============================================

-- Bảng: chitietcaban
TRUNCATE TABLE chitietcaban;
INSERT INTO chitietcaban (idChiTietCaBan, idLoaiCa, idSizeCa, soLuongTon) VALUES 
(1, 1, 1, 200.00), 
(2, 2, 3, 150.00), 
(3, 3, 5, 50.00),  
(4, 5, 6, 80.00);  

-- Bảng: banggia
TRUNCATE TABLE banggia;
INSERT INTO banggia (idchitietcaban, idloaikhachhang, giabanle, giabansi, ngaybatdau, ngayketthuc) VALUES 
(1, NULL, 55000.00, 50000.00, '2023-01-01', '2025-12-31'), 
(2, NULL, 70000.00, 65000.00, '2023-01-01', '2025-12-31'), 
(3, NULL, 60000.00, 55000.00, '2023-01-01', '2025-12-31'), 
(4, NULL, 45000.00, 40000.00, '2023-01-01', '2025-12-31');

-- =============================================
-- 3. CÁC BẢNG PHỤ TRỢ KHÁC
-- =============================================

-- Bảng: vaitro
TRUNCATE TABLE vaitro;
INSERT INTO vaitro (idVaiTro, tenVaiTro) VALUES (1, 'Admin'), (2, 'Kho'), (3, 'Bán hàng'), (4, 'Khách');

-- Bảng: nhacungcap
TRUNCATE TABLE nhacungcap;
INSERT INTO nhacungcap (idNCC, tenNCC, soDienThoai) VALUES 
(1, 'Trại Cá Giống Đồng Tháp', '0901234567'),
(2, 'Vựa Thủy Sản An Giang', '0909888777');

-- Bảng: donvitinh
TRUNCATE TABLE donvitinh;
INSERT INTO donvitinh (idDVT, tenDVT, heSoKG) VALUES (1, 'Kg', 1.0), (2, 'Con', 1.2);

-- Bảng: taikhoan
TRUNCATE TABLE taikhoan;
INSERT INTO taikhoan (idTaiKhoan, idVaiTro, ho, ten, matKhau, email, soDienThoai, diaChi) VALUES 
('11111111-1111-1111-1111-111111111111', 1, 'Nguyễn', 'Admin', 'pass', 'admin@vuaca.com', '0909999999', 'HCM');

-- =============================================
-- 4. GIAO DỊCH MẪU
-- =============================================

-- Bảng: phieunhap
TRUNCATE TABLE phieunhap;
ALTER TABLE phieunhap MODIFY COLUMN trangthaithanhtoan VARCHAR(50);
-- 2. Chạy lại lệnh thêm dữ liệu
INSERT INTO phieunhap (idphieunhap, idncc, idnguoitaophieu, ngaynhap, tongsoluong, trangthaithanhtoan) 
VALUES ('PN001', 1, '11111111-1111-1111-1111-111111111111', NOW(), 500.00, 'Đã thanh toán');
-- Bảng: chitietphbanggia