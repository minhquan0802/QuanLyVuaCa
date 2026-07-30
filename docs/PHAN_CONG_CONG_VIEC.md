# PHÂN CÔNG CÔNG VIỆC ĐỒ ÁN TỐT NGHIỆP

## 1. Thông tin chung

**Tên đề tài:** Xây dựng hệ thống quản lý mua bán cho vựa cá điêu hồng  
**Số lượng thành viên:** 02 thành viên  
**Hình thức phân công:** Phân công theo **module nghiệp vụ** và **trách nhiệm hoàn thiện - kiểm thử - tài liệu hóa**, không phân công chung chung theo kiểu một người làm toàn bộ frontend, một người làm toàn bộ backend.

Lý do chọn cách phân công này:

- Hệ thống có nhiều nghiệp vụ liên kết với nhau như đơn hàng, kho, thanh toán, công nợ, nhập hàng và thanh lý.
- Mỗi module đều có cả phần giao diện, API backend, xử lý nghiệp vụ, kiểm thử và tài liệu.
- Việc phân chia theo module giúp mỗi thành viên hiểu rõ phần mình phụ trách và có thể trình bày khi bảo vệ.
- Thành viên nắm nghiệp vụ chính sẽ phụ trách các module lõi có nhiều ràng buộc nghiệp vụ hơn.

---

## 2. Nguyên tắc phân công

Nhóm thống nhất phân công theo các nguyên tắc sau:

1. Mỗi thành viên phụ trách một nhóm chức năng rõ ràng.
2. Mỗi nhóm chức năng bao gồm cả:
   - Giao diện liên quan.
   - API/backend liên quan.
   - Luồng xử lý nghiệp vụ.
   - Kiểm thử chức năng.
   - Tài liệu mô tả và sơ đồ phân tích thiết kế.
3. Minh Quân là người nắm nghiệp vụ chính của đề tài nên phụ trách các module lõi như đơn hàng, thanh toán, công nợ, thông báo và luồng bán hàng.
4. Hồng Quân phụ trách các module quản trị dữ liệu, tài khoản, danh mục, kho, nhập hàng, thanh lý và dashboard.
5. Hai thành viên cùng tham gia tích hợp hệ thống, kiểm thử tổng thể, rà soát giao diện và hoàn thiện báo cáo.

---

## 3. Phân công tổng quát

| Thành viên | Vai trò chính | Nhóm chức năng phụ trách |
|---|---|---|
| Minh Quân | Nắm nghiệp vụ chính, phụ trách luồng nghiệp vụ lõi | Đặt hàng, giỏ hàng, tạo đơn POS, quản lý đơn hàng, thanh toán, công nợ, trạng thái đơn hàng, thông báo |
| Hồng Quân | Phụ trách nhóm quản trị dữ liệu và vận hành kho | Xác thực, tài khoản, loại cá, size cá, bảng giá, kho, nhập hàng, thanh lý, dashboard |

---

# 4. Phân công chi tiết cho Minh Quân

## 4.1 Vai trò

Minh Quân là người nắm nghiệp vụ chính của hệ thống, chịu trách nhiệm phân tích và hoàn thiện các luồng nghiệp vụ lõi liên quan đến quá trình bán hàng, đặt hàng, xử lý đơn, thanh toán, công nợ khách sỉ và thông báo hệ thống.

Các module này có mối liên hệ trực tiếp đến doanh thu, tồn kho, trạng thái đơn hàng và công nợ nên cần người hiểu rõ nghiệp vụ thực tế của vựa cá phụ trách.

---

## 4.2 Nhóm chức năng phụ trách

Minh Quân phụ trách các nhóm chức năng sau:

```txt
1. Xem sản phẩm và chọn sản phẩm mua hàng
2. Quản lý giỏ hàng
3. Đặt hàng online
4. Tạo đơn hàng tại quầy POS
5. Quản lý danh sách đơn hàng
6. Xem chi tiết đơn hàng
7. Cập nhật trạng thái đơn hàng
8. Xác nhận nhận hàng/hủy đơn hàng
9. Thanh toán đơn hàng
10. Thanh toán qua VNPAY
11. Quản lý công nợ khách sỉ
12. Kiểm tra hạn mức tín dụng khách sỉ
13. Theo dõi trạng thái thanh toán của đơn hàng
14. Quản lý thông báo và tiếp nhận thông báo thời gian thực
```

---

## 4.3 Các màn hình frontend phụ trách

### Nhóm màn hình khách hàng

```txt
client/src/pages/customer/ChiTietSanPham.jsx
client/src/pages/customer/TrangChu.jsx
client/src/pages/customer/GioHang.jsx
client/src/pages/customer/ThanhToan.jsx
client/src/pages/customer/ThongTinDonHang.jsx
client/src/pages/customer/OrderSuccess.jsx
client/src/pages/customer/OrderFailed.jsx
client/src/context/CartContext.jsx
client/src/components/DanhSachSanPham.jsx
```

### Nhóm màn hình quản trị

```txt
client/src/pages/admin/QuanLyDonHang.jsx
client/src/pages/admin/TaoDonHang.jsx
client/src/pages/admin/ChiTietDonHang.jsx
client/src/pages/admin/QuanLyCongNo.jsx
```

### Nhóm giao diện thông báo

```txt
client/src/components/admin/AdminLayout.jsx (phần chuông và danh sách thông báo)
client/src/components/Header.jsx (phần thông báo khách hàng)
```

## 4.4 Các controller/backend phụ trách

```txt
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/DonhangController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/GioHangController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/ThanhtoanController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/PaymentController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/CongNoController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/ThongBaoController.java
```

---

## 4.5 Các service/backend phụ trách

```txt
server/src/main/java/com/minhquan/QuanLyVuaCa/service/DonhangService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/GioHangService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/ThanhtoanService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/VnPayService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/CongNoService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/ThongBaoService.java
```

### Thành phần backend hỗ trợ nghiệp vụ

```txt
server/src/main/java/com/minhquan/QuanLyVuaCa/scheduler/GioHangScheduler.java
server/src/main/java/com/minhquan/QuanLyVuaCa/scheduler/CongNoQuaHanScheduler.java
server/src/main/java/com/minhquan/QuanLyVuaCa/utils/ChinhSachGiaUtils.java
server/src/main/java/com/minhquan/QuanLyVuaCa/utils/QuyDoiKhoiLuongUtils.java
```

`QuyDoiKhoiLuongUtils` chỉ là lớp tiện ích tính toán. Tên lớp giữ theo nghiệp vụ quy đổi, không đại diện cho bảng `quydoikhoiluong` đã xóa.

---

## 4.6 Entity, enum và repository liên quan

### Entity

```txt
Donhang
Chitietdonhang
GioHang
ChitietGioHang
Thanhtoan
Lichsucongno
Taikhoan
Chitietcaban
Chitietphieunhap
Thongbao
```

### Enum

```txt
TrangThaiDonHang
TrangThaiThanhToanDonHang
TrangThaiThanhToan
LoaiThayDoiCongNo
NguonGocCongNo
```

### Repository

```txt
DonhangRepository
ChitietdonhangRepository
GioHangRepository
ChitietGioHangRepository
ThanhtoanRepository
LichsucongnoRepository
TaiKhoanRepository
ChitietcabanRepository
ChitietphieunhapRepository
ThongbaoRepository
```

---

## 4.7 API phụ trách

```txt
/gio-hang
/Donhangs
/Thanhtoan
/payment
/CongNo
/ThongBao
```

Một số API tiêu biểu:

```txt
GET    /gio-hang
POST   /gio-hang/items
PUT    /gio-hang/items/{id}
DELETE /gio-hang/items/{id}
DELETE /gio-hang

GET    /Donhangs
GET    /Donhangs/search
GET    /Donhangs/{id}
POST   /Donhangs
GET    /Donhangs/my-orders
GET    /Donhangs/{id}/chitiet
PUT    /Donhangs/{id}/status
PUT    /Donhangs/{id}/cap-nhat-can-nang
PUT    /Donhangs/{id}/xac-nhan-nhan-hang
PUT    /Donhangs/{id}/huy
GET    /Donhangs/bao-cao-lech-kho
POST   /Donhangs/dong-bo-lai-ton-kho

POST   /payment/create-payment
GET    /payment/vnpay-callback
GET    /Thanhtoan/{iddonhang}/tinh-trang
POST   /Thanhtoan/chuyen-khoan
PUT    /Thanhtoan/{idthanhtoan}/xac-nhan
PUT    /Thanhtoan/{iddonhang}/thanh-toan-thu-cong

GET    /CongNo
POST   /CongNo/{idtaikhoan}/khoi-tao
GET    /CongNo/{idtaikhoan}/lich-su
PUT    /CongNo/{idtaikhoan}/han-muc
PUT    /CongNo/{idtaikhoan}/dieu-chinh
PUT    /CongNo/{idtaikhoan}/mo-khoa

GET    /ThongBao/subscribe
GET    /ThongBao
GET    /ThongBao/chua-xem
PUT    /ThongBao/{id}/da-xem
PUT    /ThongBao/da-xem-tat-ca
POST   /ThongBao
```

---

## 4.8 Luồng nghiệp vụ chịu trách nhiệm chính

### 4.8.1 Luồng đặt hàng online

```txt
Khách hàng xem sản phẩm
  -> chọn sản phẩm, size, đơn vị tính, số lượng
  -> thêm vào giỏ hàng
  -> kiểm tra giỏ hàng
  -> tạo đơn hàng
  -> chọn phương thức thanh toán
  -> thanh toán hoặc chờ xử lý
  -> theo dõi trạng thái đơn hàng
```

### 4.8.2 Luồng tạo đơn hàng tại quầy POS

```txt
Nhân viên/Admin mở màn hình tạo đơn
  -> chọn khách lẻ hoặc khách sỉ
  -> chọn sản phẩm, size, đơn vị tính, số lượng
  -> hệ thống tính khối lượng dự kiến từ hệ số kg của đơn vị tính hoặc trường sokgtuongung của chi tiết sản phẩm
  -> thêm sản phẩm vào đơn
  -> tạo đơn hàng
  -> khách lẻ: hoàn tất thanh toán tại quầy
  -> khách sỉ: chuyển đơn sang trạng thái đang đóng hàng, thanh toán sau
```

### 4.8.3 Luồng cập nhật trạng thái đơn hàng

```txt
CHO_XAC_NHAN
  -> DANG_DONG_HANG
  -> DANG_VAN_CHUYEN
  -> GIAO_HANG_THANH_CONG

CHO_XAC_NHAN
  -> HUY
```

### 4.8.4 Luồng thanh toán

```txt
Khách hàng hoặc admin tạo thanh toán
  -> hệ thống ghi nhận thông tin thanh toán
  -> nếu thanh toán online thì chuyển sang VNPAY
  -> nhận kết quả thanh toán
  -> cập nhật trạng thái thanh toán của đơn hàng
```

### 4.8.5 Luồng công nợ khách sỉ

```txt
Khách sỉ có hạn mức tín dụng
  -> hệ thống kiểm tra hạn mức trước khi đặt hàng
  -> khi đơn giao thành công thì tăng công nợ
  -> khi thanh toán được xác nhận thì giảm công nợ
  -> nếu vượt hạn mức/quá hạn thì cảnh báo hoặc khóa đặt hàng
  -> ghi lịch sử thay đổi công nợ
```

### 4.8.6 Luồng thông báo

```txt
Đơn hàng, công nợ hoặc tác vụ định kỳ phát sinh sự kiện
  -> hệ thống lưu thông báo cho người nhận
  -> đẩy thông báo thời gian thực qua SSE
  -> người dùng xem danh sách và số lượng chưa xem
  -> người dùng mở thông báo hoặc đánh dấu tất cả đã xem
```

---

## 4.9 Sơ đồ phụ trách

Minh Quân phụ trách chuẩn bị và giải thích các sơ đồ sau:

```txt
1. Activity diagram - Đặt hàng online
2. Activity diagram - Tạo đơn hàng tại quầy POS
3. Activity diagram - Cập nhật trạng thái đơn hàng
4. Activity diagram - Thanh toán đơn hàng
5. Activity diagram - Quản lý công nợ khách sỉ
6. Sequence diagram - Khách hàng đặt hàng online
7. Sequence diagram - Admin tạo đơn POS
8. Sequence diagram - Thanh toán VNPAY
9. Sequence diagram - Cập nhật công nợ khi giao hàng thành công
10. State diagram - Trạng thái đơn hàng
11. Activity/Sequence diagram - Tiếp nhận và xử lý thông báo
```

---

## 4.10 Nội dung báo cáo phụ trách

Minh Quân phụ trách viết và rà soát các phần sau trong báo cáo:

```txt
- Mô tả nghiệp vụ bán hàng của vựa cá
- Mô tả quy trình đặt hàng online
- Mô tả quy trình tạo đơn hàng tại quầy
- Mô tả quy trình xử lý trạng thái đơn hàng
- Mô tả quy trình thanh toán
- Mô tả tích hợp VNPAY
- Mô tả quy trình công nợ khách sỉ
- Thiết kế API nhóm đơn hàng, thanh toán, công nợ
- Test case nhóm đặt hàng, thanh toán, công nợ
- Mô tả module và API thông báo thời gian thực
- Test case nhóm thông báo
```

---

## 4.11 Test case phụ trách

```txt
1. Thêm sản phẩm vào giỏ hàng thành công
2. Cập nhật số lượng trong giỏ hàng
3. Xóa sản phẩm khỏi giỏ hàng
4. Đặt hàng online thành công
5. Đặt hàng khi giỏ hàng rỗng
6. Tạo đơn POS cho khách lẻ
7. Tạo đơn POS cho khách sỉ
8. Cập nhật trạng thái đơn hàng
9. Hủy đơn hàng khi còn ở trạng thái cho xác nhận
10. Xác nhận nhận hàng
11. Thanh toán VNPAY thành công
12. Thanh toán VNPAY thất bại
13. Cập nhật công nợ khi đơn giao thành công
14. Giảm công nợ khi thanh toán được xác nhận
15. Chặn đặt hàng khi khách sỉ vượt hạn mức tín dụng
16. Nhận thông báo thời gian thực qua SSE
17. Xem và đánh dấu thông báo đã xem
```

---

# 5. Phân công chi tiết cho Hồng Quân

## 5.1 Vai trò

Hồng Quân phụ trách nhóm chức năng quản trị dữ liệu, tài khoản, danh mục sản phẩm, kho, nhập hàng, thanh lý và dashboard. Đây là các module phục vụ vận hành hệ thống, cung cấp dữ liệu nền cho luồng bán hàng và quản lý hàng hóa.

---

## 5.2 Nhóm chức năng phụ trách

Hồng Quân phụ trách các nhóm chức năng sau:

```txt
1. Đăng nhập, đăng ký, xác thực email
2. Quên mật khẩu, đặt lại mật khẩu
3. Quản lý tài khoản người dùng
4. Duyệt tài khoản khách hàng
5. Khóa/mở tài khoản
6. Quản lý loại cá
7. Quản lý size cá
8. Quản lý chi tiết cá bán theo loại cá và size
9. Quản lý đơn vị tính và số kg tương ứng của từng chi tiết sản phẩm
10. Quản lý bảng giá bán lẻ/bán sỉ
11. Quản lý tồn kho
12. Tạo phiếu nhập hàng
13. Quản lý nhà cung cấp
14. Quản lý phiếu thanh lý
15. Tạo phiếu thanh lý
16. Theo dõi lô cá còn hàng/quá hạn
17. Dashboard/thống kê
```

---

## 5.3 Các màn hình frontend phụ trách

### Nhóm xác thực

```txt
client/src/pages/auth/DangNhap.jsx
client/src/pages/auth/DangKy.jsx
client/src/pages/auth/XacThucEmail.jsx
client/src/pages/auth/QuenMatKhau.jsx
client/src/pages/auth/DatLaiMatKhau.jsx
client/src/context/AuthContext.jsx
client/src/routes/ProtectedRoute.jsx
```

### Nhóm quản trị tài khoản

```txt
client/src/pages/admin/QuanLyTaiKhoan.jsx
client/src/pages/admin/ThemSuaTaiKhoan.jsx
client/src/pages/customer/Profile.jsx
```

### Nhóm danh mục cá, size, bảng giá

```txt
client/src/pages/admin/QuanLyLoaiCa.jsx
client/src/pages/admin/ThemSuaLoaiCa.jsx
client/src/pages/admin/KichCoLoaiCa.jsx
client/src/pages/admin/QuanLyBangGia.jsx
client/src/pages/admin/ThemBangGia.jsx
```

### Nhóm kho, nhập hàng, thanh lý

```txt
client/src/pages/admin/QuanLyKho.jsx
client/src/pages/admin/NhapHang.jsx
client/src/pages/admin/QuanLyThanhLy.jsx
client/src/pages/admin/TaoPhieuThanhLy.jsx
client/src/pages/admin/ThanhLyMotLo.jsx
```

### Nhóm layout và dashboard

```txt
client/src/pages/admin/AdminDashboard.jsx
client/src/components/admin/AdminLayout.jsx (phần khung bố cục; phối hợp với Minh Quân ở phần thông báo)
client/src/components/admin/AdminSidebar.jsx
client/src/components/Footer.jsx
```

`client/src/pages/admin/LichSuPhieuNhap.jsx` hiện tồn tại trong mã nguồn nhưng chưa được khai báo trong `AppRoutes`, vì vậy chưa được tính là một màn hình đang hoạt động. Lịch sử phiếu nhập hiện được hiển thị trong luồng quản lý kho/nhập hàng.

---

## 5.4 Các controller/backend phụ trách

```txt
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/AuthenticationController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/TaiKhoanController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/LoaicaController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/SizecaController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/ChitietCabanController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/BanggiaController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/DonvitinhController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/NhacungcapController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/PhieunhapController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/PhieuthanhlyController.java
server/src/main/java/com/minhquan/QuanLyVuaCa/controller/ThongKeController.java
```

---

## 5.5 Các service/backend phụ trách

```txt
server/src/main/java/com/minhquan/QuanLyVuaCa/service/AuthenticationService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/TaiKhoanService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/EmailService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/PwnedPasswordService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/LoaicaService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/SizecaService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/ChitietCabanService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/BanggiaService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/DonvitinhService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/NhacungcapService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/PhieunhapService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/PhieuthanhlyService.java
server/src/main/java/com/minhquan/QuanLyVuaCa/service/ThongKeService.java
```

### Thành phần backend hỗ trợ nghiệp vụ

```txt
server/src/main/java/com/minhquan/QuanLyVuaCa/scheduler/LoHangQuaHanScheduler.java
server/src/main/java/com/minhquan/QuanLyVuaCa/configuration/SecurtyConfig.java
server/src/main/java/com/minhquan/QuanLyVuaCa/configuration/JwtCookieTokenResolver.java
server/src/main/java/com/minhquan/QuanLyVuaCa/configuration/JwtTokenDecoder.java
server/src/main/java/com/minhquan/QuanLyVuaCa/configuration/AuthRateLimitFilter.java
server/src/main/java/com/minhquan/QuanLyVuaCa/configuration/CloudinaryConfig.java
```

`LoHangQuaHanScheduler` thuộc nghiệp vụ kho/thanh lý do Hồng Quân phụ trách, nhưng sử dụng `ThongBaoService` của Minh Quân để gửi cảnh báo.

---

## 5.6 Entity, enum và repository liên quan

### Entity

```txt
Taikhoan
Loaica
Sizeca
Chitietcaban
Banggia
Donvitinh
Nhacungcap
Phieunhap
Chitietphieunhap
Phieuthanhly
Chitietphieuthanhly
```

Lưu ý về mô hình dữ liệu hiện tại:

```txt
Không còn bảng hoặc entity quydoikhoiluong.
Trường sokgtuongung được lưu trực tiếp trong bảng chitietsanpham
(entity Chitietcaban trong Backend) để biểu diễn khối lượng trung bình của từng biến thể cá.
Bảng donvitinh vẫn giữ trường hesokg cho những đơn vị có hệ số kg cố định.
Khi tính khối lượng, hệ thống ưu tiên donvitinh.hesokg hợp lệ;
nếu đơn vị không có hệ số riêng thì sử dụng chitietsanpham.sokgtuongung.
```

### Enum

```txt
VaiTro
TrangThaiTaiKhoan
TrangThaiCa
TrangThaiThanhLy
```

### Repository

```txt
TaiKhoanRepository
LoaicaRepository
SizecaRepository
ChitietcabanRepository
BanggiaRepository
DonvitinhRepository
NhacungcapRepository
PhieunhapRepository
ChitietphieunhapRepository
PhieuthanhlyRepository
ChitietphieuthanhlyRepository
```

---

## 5.7 API phụ trách

```txt
/auth
/tai-khoan
/Loaicas
/Sizecas
/Chitietcabans
/Banggias
/Donvitinhs
/Nhacungcaps
/Phieunhaps
/Phieuthanhlys
/Thongke
```

Một số API tiêu biểu:

```txt
POST   /auth/token
GET    /auth/csrf
POST   /auth/refresh
POST   /auth/logout

GET    /tai-khoan
GET    /tai-khoan/{id}
POST   /tai-khoan
PUT    /tai-khoan/{id}
DELETE /tai-khoan/{id}
GET    /tai-khoan/cho-duyet
PUT    /tai-khoan/duyet/{id}
GET    /tai-khoan/my-info
GET    /tai-khoan/verify-email
POST   /tai-khoan/resend-verification
POST   /tai-khoan/quen-mat-khau
POST   /tai-khoan/dat-lai-mat-khau
PUT    /tai-khoan/doi-mat-khau

GET    /Loaicas
GET    /Loaicas/admin/all
GET    /Loaicas/{id}
POST   /Loaicas
PUT    /Loaicas/{id}
DELETE /Loaicas/{id}
PATCH  /Loaicas/{id}/khoi-phuc

GET    /Sizecas
POST   /Sizecas
DELETE /Sizecas/{id}

GET    /Chitietcabans
POST   /Chitietcabans
PUT    /Chitietcabans/{id}/so-kg-tuong-ung
DELETE /Chitietcabans/{id}

GET    /Banggias
POST   /Banggias
GET    /Banggias/history
DELETE /Banggias/{id}

GET    /Donvitinhs
GET    /Donvitinhs/{id}
POST   /Donvitinhs
PUT    /Donvitinhs/{id}
DELETE /Donvitinhs/{id}

GET    /Nhacungcaps
POST   /Nhacungcaps

GET    /Phieunhaps
POST   /Phieunhaps
PATCH  /Phieunhaps/{id}/thanh-toan

GET    /Phieuthanhlys
GET    /Phieuthanhlys/tat-ca-lo-con-hang
GET    /Phieuthanhlys/lo-con-hang
GET    /Phieuthanhlys/lo-qua-han
POST   /Phieuthanhlys

GET    /Thongke/tong-quan
GET    /Thongke/luan-chuyen-hang-hoa
```

---

## 5.8 Luồng nghiệp vụ chịu trách nhiệm chính

### 5.8.1 Luồng xác thực tài khoản

```txt
Người dùng đăng ký tài khoản
  -> hệ thống gửi email xác thực
  -> người dùng xác thực email
  -> tài khoản chờ duyệt hoặc hoạt động tùy vai trò
  -> người dùng đăng nhập
  -> hệ thống cấp token/cookie
  -> truy cập chức năng theo quyền
```

### 5.8.2 Luồng quản lý tài khoản

```txt
Admin xem danh sách tài khoản
  -> duyệt tài khoản khách hàng
  -> thêm hoặc cập nhật tài khoản
  -> khóa/mở tài khoản nếu cần
```

### 5.8.3 Luồng quản lý danh mục cá

```txt
Admin tạo loại cá
  -> tạo size cá
  -> tạo chi tiết cá bán theo loại cá và size
  -> nhập trường sokgtuongung trực tiếp cho chi tiết sản phẩm
  -> thiết lập hesokg cho đơn vị tính nếu đơn vị có hệ số kg cố định
  -> thiết lập bảng giá bán lẻ/bán sỉ
```

### 5.8.4 Luồng nhập hàng

```txt
Admin chọn nhà cung cấp
  -> chọn sản phẩm cá cần nhập
  -> nhập số lượng, giá nhập, thông tin lô
  -> tạo phiếu nhập
  -> hệ thống cập nhật chi tiết lô hàng
  -> hệ thống cập nhật tồn kho tổng
```

### 5.8.5 Luồng thanh lý

```txt
Admin xem danh sách lô còn hàng/quá hạn
  -> chọn lô cần thanh lý
  -> nhập số lượng/thông tin thanh lý
  -> tạo phiếu thanh lý
  -> hệ thống cập nhật số lượng còn lại của lô
  -> hệ thống cập nhật tồn kho tổng
```

### 5.8.6 Luồng dashboard/thống kê

```txt
Admin/Nhân viên truy cập Dashboard
  -> chọn mốc hoặc khoảng thời gian thống kê
  -> hệ thống tổng hợp doanh thu, chi phí và số đơn hoàn thành
  -> hệ thống tổng hợp luân chuyển nhập, bán, hao hụt theo loại cá
  -> hiển thị chỉ số, danh sách đơn hàng và bảng/biểu đồ
```

---

## 5.9 Sơ đồ phụ trách

Hồng Quân phụ trách chuẩn bị và giải thích các sơ đồ sau:

```txt
1. Activity diagram - Đăng nhập
2. Activity diagram - Đăng ký và xác thực email
3. Activity diagram - Quên mật khẩu/đặt lại mật khẩu
4. Activity diagram - Quản lý tài khoản
5. Activity diagram - Quản lý loại cá, size cá
6. Activity diagram - Tạo bảng giá
7. Activity diagram - Nhập hàng
8. Activity diagram - Thanh lý lô cá
9. Activity diagram - Dashboard/thống kê
10. Sequence diagram - Đăng nhập
11. Sequence diagram - Nhập hàng
12. Sequence diagram - Thanh lý
13. ERD nhóm danh mục, kho, nhập hàng, thanh lý
```

---

## 5.10 Nội dung báo cáo phụ trách

Hồng Quân phụ trách viết và rà soát các phần sau trong báo cáo:

```txt
- Mô tả module xác thực và phân quyền
- Mô tả module quản lý tài khoản
- Mô tả module quản lý loại cá, size cá
- Mô tả module bảng giá, đơn vị tính và trường sokgtuongung của chi tiết sản phẩm
- Mô tả module quản lý kho
- Mô tả module nhập hàng
- Mô tả module thanh lý
- Mô tả module dashboard/thống kê
- Thiết kế API nhóm tài khoản, danh mục, kho, nhập hàng, thanh lý, thống kê
- Test case nhóm tài khoản, danh mục, kho, nhập hàng, thanh lý, thống kê
```

---

## 5.11 Test case phụ trách

```txt
1. Đăng ký tài khoản thành công
2. Đăng nhập thành công
3. Đăng nhập sai mật khẩu
4. Xác thực email thành công
5. Gửi lại email xác thực
6. Quên mật khẩu
7. Đặt lại mật khẩu
8. Admin duyệt tài khoản khách hàng
9. Admin khóa/mở tài khoản
10. Thêm loại cá
11. Cập nhật loại cá
12. Thêm size cá
13. Tạo chi tiết cá bán
14. Cập nhật sokgtuongung trên chi tiết sản phẩm và hesokg của đơn vị tính
15. Tạo bảng giá
16. Xem tồn kho
17. Tạo phiếu nhập hàng
18. Tạo phiếu thanh lý
19. Xem chỉ số tổng quan theo khoảng thời gian
20. Xem luân chuyển nhập, bán và hao hụt theo loại cá
21. Từ chối mật khẩu đã xuất hiện trong dữ liệu rò rỉ
22. Giới hạn số lần đăng nhập sai và đọc JWT từ cookie
```

---

# 6. Công việc chung của cả hai thành viên

Ngoài phần phân công riêng, hai thành viên cùng thực hiện các công việc sau:

```txt
1. Tích hợp frontend và backend.
2. Kiểm thử tổng thể toàn hệ thống.
3. Rà soát giao diện trước khi demo.
4. Chạy thử các luồng nghiệp vụ chính.
5. Chuẩn bị dữ liệu demo.
6. Viết phần tổng quan đề tài.
7. Viết phần kết luận và hướng phát triển.
8. Chuẩn hóa định dạng báo cáo.
9. Chuẩn bị slide thuyết trình.
10. Chuẩn bị kịch bản demo.
11. Hỗ trợ nhau xử lý lỗi phát sinh trước ngày bảo vệ.
```

Các file hạ tầng Frontend dùng chung do cả hai cùng rà soát:

```txt
client/src/main.jsx
client/src/routes/app-routes.jsx
client/src/config/axios.js
client/src/context/ToastContext.jsx
client/src/context/ConfirmContext.jsx
```

Trong đó, Hồng Quân chịu trách nhiệm chính phần xác thực/phân quyền; Minh Quân chịu trách nhiệm kiểm tra ảnh hưởng của Axios, Toast và Confirm tới các luồng đặt hàng, thanh toán, công nợ và thông báo.

---

# 7. Bảng minh chứng kết quả bàn giao

| Thành viên | Kết quả bàn giao chính | Minh chứng |
|---|---|---|
| Minh Quân | Nhóm chức năng đặt hàng, đơn hàng, thanh toán, công nợ, thông báo | Màn hình đặt hàng, giỏ hàng, checkout, đơn hàng của tôi, quản lý đơn, tạo đơn POS, quản lý công nợ và thông báo; API `/gio-hang`, `/Donhangs`, `/payment`, `/Thanhtoan`, `/CongNo`, `/ThongBao`; sơ đồ activity/sequence/state; test case |
| Hồng Quân | Nhóm chức năng tài khoản, danh mục, kho, nhập hàng, thanh lý, thống kê | Màn hình đăng nhập, đăng ký, tài khoản, loại cá, size, bảng giá, kho, nhập hàng, thanh lý, dashboard; API `/auth`, `/tai-khoan`, `/Loaicas`, `/Sizecas`, `/Chitietcabans`, `/Banggias`, `/Phieunhaps`, `/Phieuthanhlys`, `/Thongke`; sơ đồ activity/sequence/ERD; test case |

---

# 8. Phân công phần sơ đồ trong luận văn

## Minh Quân

```txt
- Use case nhóm khách hàng đặt hàng
- Use case nhóm admin quản lý đơn hàng
- Activity đặt hàng online
- Activity tạo đơn POS
- Activity cập nhật trạng thái đơn hàng
- Activity thanh toán
- Activity công nợ
- Sequence đặt hàng online
- Sequence tạo đơn POS
- Sequence thanh toán VNPAY
- State diagram trạng thái đơn hàng
- Activity/Sequence xử lý thông báo
```

## Hồng Quân

```txt
- Use case nhóm quản trị tài khoản
- Use case nhóm quản lý danh mục cá
- Use case nhóm kho, nhập hàng, thanh lý
- Activity đăng nhập/đăng ký
- Activity quản lý tài khoản
- Activity thêm loại cá/size cá
- Activity tạo bảng giá
- Activity nhập hàng
- Activity thanh lý
- Sequence đăng nhập
- Sequence nhập hàng
- Sequence thanh lý
- ERD nhóm danh mục, kho, nhập hàng, thanh lý
```

## Cả hai cùng rà soát

```txt
- ERD tổng thể hệ thống
- Sơ đồ kiến trúc tổng thể
- Sơ đồ phân rã chức năng
- Sơ đồ navigation frontend
- Bảng mô tả API tổng hợp
```

---

# 9. Phân công phần báo cáo luận văn

| Phần báo cáo | Người phụ trách chính | Người hỗ trợ |
|---|---|---|
| Tổng quan đề tài | Cả hai | Cả hai |
| Khảo sát hiện trạng và yêu cầu | Minh Quân | Hồng Quân |
| Cơ sở lý thuyết/công nghệ sử dụng | Hồng Quân | Minh Quân |
| Phân tích nghiệp vụ bán hàng, đơn hàng, thanh toán, công nợ | Minh Quân | Hồng Quân |
| Phân tích nghiệp vụ tài khoản, danh mục, kho, nhập hàng, thanh lý | Hồng Quân | Minh Quân |
| Phân tích nghiệp vụ thông báo thời gian thực | Minh Quân | — |
| Phân tích nghiệp vụ dashboard/thống kê | Hồng Quân | Minh Quân |
| Thiết kế cơ sở dữ liệu | Cả hai | Cả hai |
| Thiết kế giao diện và luồng người dùng | Cả hai | Cả hai |
| Cài đặt module đơn hàng, thanh toán, công nợ, thông báo | Minh Quân | — |
| Cài đặt module tài khoản, danh mục, kho, thanh lý, thống kê | Hồng Quân | Minh Quân |
| Kiểm thử module đơn hàng, thanh toán, công nợ, thông báo | Minh Quân | — |
| Kiểm thử module tài khoản, danh mục, kho, thanh lý, thống kê | Hồng Quân | Minh Quân |
| Kết luận và hướng phát triển | Cả hai | Cả hai |
| Slide và kịch bản demo | Cả hai | Cả hai |

---

# 10. Kịch bản demo theo phân công

## Minh Quân demo

```txt
1. Khách hàng xem chi tiết sản phẩm.
2. Thêm sản phẩm vào giỏ hàng.
3. Đặt hàng online.
4. Thanh toán hoặc tạo yêu cầu thanh toán.
5. Admin xem và cập nhật trạng thái đơn hàng.
6. Admin tạo đơn hàng tại quầy POS.
7. Admin xem/cập nhật công nợ khách sỉ.
8. Người dùng nhận, xem và đánh dấu thông báo đã xem.
```

## Hồng Quân demo

```txt
1. Đăng ký/đăng nhập tài khoản.
2. Admin duyệt hoặc quản lý tài khoản.
3. Admin thêm loại cá/size cá.
4. Admin tạo bảng giá.
5. Admin xem tồn kho.
6. Admin tạo phiếu nhập hàng.
7. Admin tạo phiếu thanh lý.
8. Admin xem Dashboard và luân chuyển hàng hóa theo thời gian.
```

---

# 11. Ghi chú về việc sử dụng công cụ hỗ trợ lập trình

Trong quá trình phát triển, nhóm có sử dụng công cụ hỗ trợ lập trình để tăng tốc xây dựng giao diện và xử lý một số phần mã nguồn. Tuy nhiên, nhóm chịu trách nhiệm:

```txt
- Rà soát lại mã nguồn.
- Kiểm thử chức năng.
- Điều chỉnh theo nghiệp vụ thực tế.
- Tài liệu hóa lại module.
- Vẽ sơ đồ phân tích thiết kế.
- Chuẩn bị demo và giải thích luồng xử lý.
```

Do đó, việc phân công trong tài liệu này tập trung vào trách nhiệm cuối cùng của từng thành viên đối với từng module, bao gồm cả hiểu nghiệp vụ, kiểm thử và trình bày khi bảo vệ.

---

# 12. Kết luận phân công

Việc phân công theo module giúp tránh tình trạng mô tả chung chung như “một người làm frontend, một người làm backend”. Mỗi thành viên đều có phạm vi trách nhiệm rõ ràng, có màn hình, API, service, sơ đồ, test case và nội dung báo cáo tương ứng.

Tóm tắt:

```txt
Minh Quân:
  Phụ trách nghiệp vụ lõi bán hàng, đơn hàng, thanh toán, công nợ, thông báo.

Hồng Quân:
  Phụ trách nghiệp vụ quản trị tài khoản, danh mục, kho, nhập hàng, thanh lý, dashboard/thống kê.

Cả hai:
  Cùng tích hợp, kiểm thử tổng thể, hoàn thiện báo cáo, chuẩn bị slide và demo.
```

