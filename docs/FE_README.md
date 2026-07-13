# FE_README - Hướng dẫn đọc Frontend QuanLyVuaCa

Tài liệu này dùng để giúp thành viên mới đọc code FE nhanh hơn, đặc biệt trong bối cảnh nhiều màn hình được AI sinh ra nên code còn dài và rối. Mục tiêu là hiểu **màn hình - route - luồng người dùng - API gọi xuống BE**, không cần đọc thuộc từng dòng JSX hoặc từng `className` Tailwind.

> Nguyên tắc đọc FE: đọc theo **luồng nghiệp vụ** trước, sau đó mới đọc chi tiết component/page.

---

## 1. Tổng quan công nghệ

Frontend nằm trong thư mục:

```txt
client/
```

Công nghệ chính:

```txt
React
Vite
React Router
Axios
Tailwind CSS/className utility
Context API
```

Các vùng code chính:

```txt
client/src/
  components/        Component dùng lại: header, footer, layout admin, sidebar
  config/            Cấu hình axios/API
  context/           AuthContext, CartContext, ToastContext
  pages/             Các màn hình chính của hệ thống
  routes/            Khai báo route và bảo vệ route admin
  main.jsx           Entry point
```

---

## 2. Cấu trúc thư mục FE

```txt
client/src/
  components/
    admin/
      AdminLayout.jsx
      AdminSidebar.jsx
    footer.jsx
    header.jsx
    product-list.jsx

  config/
    axios.js

  context/
    AuthContext.jsx
    CartContext.jsx
    ToastContext.jsx

  pages/
    auth/
      login.jsx
      register.jsx
      XacThucEmail.jsx
      QuenMatKhau.jsx
      DatLaiMatKhau.jsx

    customer/
      home.jsx
      product-detail.jsx
      cart.jsx
      checkout.jsx
      Profile.jsx
      ThongTinDonHang.jsx
      OrderSuccess.jsx
      OrderFailed.jsx

    admin/
      AdminDashboard.jsx
      QuanLyLoaiCa.jsx
      ThemSuaLoaiCa.jsx
      KichCoLoaiCa.jsx
      QuanLyTaiKhoan.jsx
      ThemSuaTaiKhoan.jsx
      QuanLyDonHang.jsx
      TaoDonHang.jsx
      ChiTietDonHang.jsx
      QuanLyBangGia.jsx
      ThemBangGia.jsx
      QuanLyKho.jsx
      NhapHang.jsx
      QuanLyThanhLy.jsx
      TaoPhieuThanhLy.jsx
      QuanLyCongNo.jsx

  routes/
    app-routes.jsx
    ProtectedRoute.jsx
```

---

## 3. File nên đọc đầu tiên

Đừng mở ngay các page 300-600 dòng. Nên đọc theo thứ tự:

```txt
1. client/src/routes/app-routes.jsx
2. client/src/config/axios.js
3. client/src/context/AuthContext.jsx
4. client/src/routes/ProtectedRoute.jsx
5. client/src/context/CartContext.jsx
6. client/src/components/admin/AdminLayout.jsx
7. client/src/components/admin/AdminSidebar.jsx
8. client/src/components/header.jsx
```

Ý nghĩa:

| File | Vai trò |
|---|---|
| `app-routes.jsx` | Biết toàn bộ route/màn hình của hệ thống |
| `axios.js` | Cấu hình base URL, cookie, refresh token/logout |
| `AuthContext.jsx` | Lưu user hiện tại, kiểm tra đăng nhập |
| `ProtectedRoute.jsx` | Chặn route admin nếu chưa đăng nhập/không đủ quyền |
| `CartContext.jsx` | Quản lý giỏ hàng phía customer |
| `AdminLayout.jsx` | Layout admin + thông báo |
| `AdminSidebar.jsx` | Menu admin |
| `header.jsx` | Header customer |

---

## 4. Route chính của hệ thống

### 4.1 Auth routes

```txt
/login
/register
/xac-thuc-email
/quen-mat-khau
/dat-lai-mat-khau
```

Màn hình tương ứng:

```txt
pages/auth/login.jsx
pages/auth/register.jsx
pages/auth/XacThucEmail.jsx
pages/auth/QuenMatKhau.jsx
pages/auth/DatLaiMatKhau.jsx
```

---

### 4.2 Customer routes

Các route này nằm trong `CustomerLayout`, có `Header` và `Footer`.

```txt
/
/home
/product-detail
/product-detail/:product_id
/cart
/checkout
/profile
/order-success
/order-failed
/my-orders
```

Màn hình tương ứng:

| Route | File | Chức năng |
|---|---|---|
| `/`, `/home` | `home.jsx` | Trang chủ |
| `/product-detail/:product_id` | `product-detail.jsx` | Chi tiết sản phẩm, chọn size/ĐVT, thêm giỏ |
| `/cart` | `cart.jsx` | Xem/cập nhật giỏ hàng |
| `/checkout` | `checkout.jsx` | Tạo đơn hàng, chọn thanh toán |
| `/profile` | `Profile.jsx` | Thông tin cá nhân, đổi mật khẩu |
| `/my-orders` | `ThongTinDonHang.jsx` | Xem đơn hàng của tôi, thanh toán, xác nhận nhận hàng, hủy đơn |
| `/order-success` | `OrderSuccess.jsx` | Thanh toán/đặt hàng thành công |
| `/order-failed` | `OrderFailed.jsx` | Thanh toán thất bại |

---

### 4.3 Admin routes

Các route admin được bọc bởi `ProtectedRoute`.

```txt
/admin
/admin/QuanLyLoaiCa
/admin/QuanLyLoaiCa/them
/admin/QuanLyLoaiCa/sua/:id
/admin/QuanLyLoaiCa/kich-co/:loaicaId
/admin/QuanLyTaiKhoan
/admin/QuanLyTaiKhoan/them
/admin/QuanLyTaiKhoan/sua/:id
/admin/QuanLyDonHang
/admin/QuanLyDonHang/tao-don
/admin/QuanLyDonHang/chi-tiet/:id
/admin/QuanLyBangGia
/admin/QuanLyBangGia/them
/admin/QuanLyKho
/admin/QuanLyKho/nhap-hang
/admin/QuanLyThanhLy
/admin/QuanLyThanhLy/tao-phieu
/admin/QuanLyCongNo
```

Màn hình tương ứng:

| Route | File | Chức năng |
|---|---|---|
| `/admin` | `AdminDashboard.jsx` | Dashboard/thống kê |
| `/admin/QuanLyLoaiCa` | `QuanLyLoaiCa.jsx` | Danh sách loại cá |
| `/admin/QuanLyLoaiCa/them` | `ThemSuaLoaiCa.jsx` | Thêm loại cá |
| `/admin/QuanLyLoaiCa/sua/:id` | `ThemSuaLoaiCa.jsx` | Sửa loại cá |
| `/admin/QuanLyLoaiCa/kich-co/:loaicaId` | `KichCoLoaiCa.jsx` | Quản lý size/quy đổi theo loại cá |
| `/admin/QuanLyTaiKhoan` | `QuanLyTaiKhoan.jsx` | Quản lý tài khoản |
| `/admin/QuanLyTaiKhoan/them` | `ThemSuaTaiKhoan.jsx` | Thêm tài khoản |
| `/admin/QuanLyTaiKhoan/sua/:id` | `ThemSuaTaiKhoan.jsx` | Sửa tài khoản |
| `/admin/QuanLyDonHang` | `QuanLyDonHang.jsx` | Danh sách đơn hàng |
| `/admin/QuanLyDonHang/tao-don` | `TaoDonHang.jsx` | Tạo đơn POS tại quầy |
| `/admin/QuanLyDonHang/chi-tiet/:id` | `ChiTietDonHang.jsx` | Chi tiết đơn hàng, cập nhật cân nặng/trạng thái |
| `/admin/QuanLyBangGia` | `QuanLyBangGia.jsx` | Danh sách bảng giá |
| `/admin/QuanLyBangGia/them` | `ThemBangGia.jsx` | Thêm bảng giá |
| `/admin/QuanLyKho` | `QuanLyKho.jsx` | Tồn kho cá bán |
| `/admin/QuanLyKho/nhap-hang` | `NhapHang.jsx` | Tạo phiếu nhập |
| `/admin/QuanLyThanhLy` | `QuanLyThanhLy.jsx` | Quản lý phiếu/lô thanh lý |
| `/admin/QuanLyThanhLy/tao-phieu` | `TaoPhieuThanhLy.jsx` | Tạo phiếu thanh lý |
| `/admin/QuanLyCongNo` | `QuanLyCongNo.jsx` | Quản lý công nợ khách sỉ |

---

## 5. Các context quan trọng

### 5.1 AuthContext

File:

```txt
client/src/context/AuthContext.jsx
```

Nhiệm vụ:

```txt
- Kiểm tra user hiện tại bằng /tai-khoan/my-info
- Nếu access token hết hạn thì gọi /auth/refresh
- Lưu user vào state
- Cung cấp logout()
```

Dữ liệu cung cấp:

```txt
user
setUser
loading
logout
```

Luồng đơn giản:

```txt
App load
  -> AuthContext gọi /tai-khoan/my-info
  -> nếu 401 thì gọi /auth/refresh
  -> nếu refresh thành công thì gọi lại /my-info
  -> setUser(result)
```

---

### 5.2 CartContext

File:

```txt
client/src/context/CartContext.jsx
```

Nhiệm vụ:

```txt
- Load giỏ hàng khi user đăng nhập
- Thêm sản phẩm vào giỏ
- Cập nhật số lượng
- Xóa sản phẩm khỏi giỏ
- Xóa toàn bộ giỏ sau khi đặt hàng
- Tính tổng số món, tổng kg, tổng tiền
```

API chính:

```txt
GET    /gio-hang
POST   /gio-hang/items
PUT    /gio-hang/items/{idchitietgiohang}
DELETE /gio-hang/items/{idchitietgiohang}
DELETE /gio-hang
```

Dữ liệu cung cấp:

```txt
cart
gioHang
addToCart
updateQuantity
removeFromCart
clearCart
totalItems
totalWeight
totalPrice
```

---

### 5.3 ToastContext

File:

```txt
client/src/context/ToastContext.jsx
```

Nhiệm vụ:

```txt
- Hiển thị thông báo success/error/info trên FE
```

Thường dùng dạng:

```jsx
const { showToast } = useToast();
showToast("Tạo đơn thành công", "success");
```

---

## 6. Luồng customer mua hàng online

Các file chính:

```txt
home.jsx
product-list.jsx
product-detail.jsx
CartContext.jsx
cart.jsx
checkout.jsx
OrderSuccess.jsx
OrderFailed.jsx
ThongTinDonHang.jsx
```

Luồng tổng quát:

```txt
Khách vào trang chủ
  -> xem danh sách sản phẩm
  -> vào chi tiết sản phẩm
  -> chọn loại cá/size/đơn vị tính/số lượng
  -> thêm vào giỏ hàng
  -> vào giỏ hàng
  -> cập nhật số lượng nếu cần
  -> checkout
  -> tạo đơn hàng
  -> nếu thanh toán online thì tạo payment VNPAY
  -> điều hướng success/failed
  -> xem đơn trong /my-orders
```

API liên quan:

```txt
GET  /Loaicas/{product_id}
GET  /Banggias
GET  /Quydois
GET  /Chitietcabans
GET  /Donvitinhs
POST /gio-hang/items
GET  /gio-hang
POST /Donhangs
POST /payment/create-payment
GET  /Donhangs/my-orders
GET  /Donhangs/{id}/chitiet
PUT  /Donhangs/{id}/xac-nhan-nhan-hang
PUT  /Donhangs/{id}/huy
GET  /Thanhtoan/{iddonhang}/tinh-trang
```

Sequence tóm tắt:

```txt
Customer -> product-detail.jsx -> CartContext.addToCart()
CartContext -> BE /gio-hang/items
Customer -> cart.jsx -> checkout.jsx
checkout.jsx -> BE /Donhangs
checkout.jsx -> BE /payment/create-payment nếu chọn VNPAY
BE -> VNPAY -> FE /order-success hoặc /order-failed
Customer -> ThongTinDonHang.jsx -> BE /Donhangs/my-orders
```

---

## 7. Luồng admin tạo đơn POS

File chính:

```txt
pages/admin/TaoDonHang.jsx
pages/admin/tao-don-hang/
```

Thư mục refactor hỗ trợ:

```txt
client/src/pages/admin/tao-don-hang/
  constants.js
  components/
    BangSanPhamDaChon.jsx
    ManHinhHoanTatDonHang.jsx
  utils/
    dinhDangTien.js
    xuLyDonHang.js
```

Luồng tổng quát:

```txt
Admin mở Tạo đơn hàng POS
  -> FE load khách hàng, sản phẩm kho, đơn vị tính, bảng giá, quy đổi
  -> admin chọn khách lẻ hoặc khách sỉ
  -> nhập/chọn thông tin khách
  -> chọn loại cá, size, đơn vị tính, số lượng
  -> FE tính kg quy đổi và giá áp dụng
  -> thêm vào giỏ đơn hàng
  -> submit tạo đơn
  -> FE gọi POST /Donhangs
  -> hiển thị màn hoàn tất
```

API liên quan:

```txt
GET  /tai-khoan
GET  /Chitietcabans
GET  /Donvitinhs
GET  /Banggias
GET  /Quydois
POST /Donhangs
```

Ghi chú nghiệp vụ:

```txt
- Khách lẻ: thường tạo đơn đã thanh toán.
- Khách sỉ: tạo đơn chuyển sang trạng thái đang đóng hàng, thanh toán sau.
```

---

## 8. Luồng admin quản lý đơn hàng

File chính:

```txt
pages/admin/QuanLyDonHang.jsx
pages/admin/ChiTietDonHang.jsx
```

Luồng:

```txt
Admin vào Quản lý đơn hàng
  -> FE gọi GET /Donhangs
  -> hiển thị danh sách đơn
  -> admin mở chi tiết
  -> FE gọi GET /Donhangs/{id}/chitiet
  -> admin có thể cập nhật cân nặng thực tế
  -> admin cập nhật trạng thái đơn hàng
```

API liên quan:

```txt
GET /Donhangs
GET /Donhangs/{id}/chitiet
PUT /Donhangs/{id}/cap-nhat-can-nang
PUT /Donhangs/{id}/status
```

Sơ đồ nên vẽ:

```txt
Admin -> QuanLyDonHang.jsx -> /Donhangs
Admin -> ChiTietDonHang.jsx -> /Donhangs/{id}/chitiet
Admin -> cập nhật trạng thái -> /Donhangs/{id}/status
```

---

## 9. Luồng quản lý kho và nhập hàng

File chính:

```txt
pages/admin/QuanLyKho.jsx
pages/admin/NhapHang.jsx
```

Luồng:

```txt
Admin vào Quản lý kho
  -> FE gọi GET /Chitietcabans
  -> xem tồn kho theo loại cá/size
  -> admin vào Nhập hàng
  -> FE load sản phẩm, nhà cung cấp, bảng giá
  -> admin chọn sản phẩm nhập, số lượng, giá nhập, ngày nhập/hạn dùng nếu có
  -> submit phiếu nhập
  -> BE cập nhật phiếu nhập, chi tiết nhập và tồn kho
```

API liên quan:

```txt
GET  /Chitietcabans
GET  /Nhacungcaps
GET  /Banggias
POST /Phieunhaps
```

---

## 10. Luồng quản lý thanh lý

File chính:

```txt
pages/admin/QuanLyThanhLy.jsx
pages/admin/TaoPhieuThanhLy.jsx
```

Luồng:

```txt
Admin vào Quản lý thanh lý
  -> FE gọi GET /Phieuthanhlys
  -> FE gọi GET /Phieuthanhlys/tat-ca-lo-con-hang
  -> xem lô còn hàng/quá hạn
  -> tạo phiếu thanh lý nhanh hoặc vào màn tạo phiếu
  -> chọn lô cần thanh lý
  -> submit POST /Phieuthanhlys
```

API liên quan:

```txt
GET  /Phieuthanhlys
GET  /Phieuthanhlys/tat-ca-lo-con-hang
GET  /Phieuthanhlys/lo-con-hang?idchitietcaban={id}
POST /Phieuthanhlys
```

---

## 11. Luồng quản lý công nợ

File chính:

```txt
pages/admin/QuanLyCongNo.jsx
```

Luồng:

```txt
Admin vào Quản lý công nợ
  -> FE gọi GET /CongNo
  -> FE gọi GET /tai-khoan để lấy danh sách khách
  -> admin xem nợ hiện tại/hạn mức/trạng thái
  -> admin cập nhật hạn mức tín dụng
  -> admin điều chỉnh công nợ nếu cần
  -> admin mở khóa đặt hàng nếu khách bị khóa
  -> admin xem lịch sử công nợ
```

API liên quan:

```txt
GET /CongNo
GET /tai-khoan
PUT /CongNo/{idtaikhoan}/han-muc
PUT /CongNo/{idtaikhoan}/dieu-chinh
PUT /CongNo/{idtaikhoan}/mo-khoa
GET /CongNo/{idtaikhoan}/lich-su
```

Ghi chú:

```txt
FE chỉ hiển thị và gửi thao tác. Logic thật về tăng/giảm nợ, hạn mức, khóa đặt hàng nằm ở BE CongNoService.
```

---

## 12. Luồng quản lý danh mục cá, size, giá

File chính:

```txt
pages/admin/QuanLyLoaiCa.jsx
pages/admin/ThemSuaLoaiCa.jsx
pages/admin/KichCoLoaiCa.jsx
pages/admin/QuanLyBangGia.jsx
pages/admin/ThemBangGia.jsx
```

Luồng:

```txt
Admin quản lý loại cá
  -> thêm/sửa loại cá
  -> thêm size cá
  -> tạo Chitietcaban cho cặp loại cá-size
  -> tạo quy đổi đơn vị/kg
  -> tạo bảng giá bán lẻ/bán sỉ
```

API liên quan:

```txt
GET    /Loaicas
GET    /Loaicas/{id}
POST   /Loaicas
PUT    /Loaicas/{id}
GET    /Sizecas
POST   /Sizecas
GET    /Chitietcabans
POST   /Chitietcabans
DELETE /Chitietcabans/{id}
GET    /Quydois
POST   /Quydois
GET    /Banggias
POST   /Banggias
```

---

## 13. Luồng quản lý tài khoản

File chính:

```txt
pages/admin/QuanLyTaiKhoan.jsx
pages/admin/ThemSuaTaiKhoan.jsx
pages/customer/Profile.jsx
```

Luồng admin:

```txt
Admin xem danh sách tài khoản
  -> duyệt tài khoản khách hàng
  -> khóa/mở tài khoản
  -> thêm tài khoản
  -> sửa thông tin tài khoản
```

Luồng customer:

```txt
Khách vào profile
  -> cập nhật thông tin cá nhân
  -> đổi mật khẩu
```

API liên quan:

```txt
GET  /tai-khoan
POST /tai-khoan
PUT  /tai-khoan/{id}
PUT  /tai-khoan/duyet/{id}
PUT  /tai-khoan/doi-mat-khau
```

---

## 14. Luồng auth

File chính:

```txt
pages/auth/login.jsx
pages/auth/register.jsx
pages/auth/XacThucEmail.jsx
pages/auth/QuenMatKhau.jsx
pages/auth/DatLaiMatKhau.jsx
context/AuthContext.jsx
config/axios.js
```

Luồng đăng nhập:

```txt
User nhập email/password
  -> login.jsx gọi POST /auth/token
  -> gọi GET /tai-khoan/my-info
  -> setUser vào AuthContext
  -> nếu admin thì chuyển /admin
  -> nếu customer thì chuyển /home
```

API liên quan:

```txt
POST /auth/token
POST /auth/refresh
POST /auth/logout
GET  /tai-khoan/my-info
POST /tai-khoan
GET  /tai-khoan/verify-email?token=...
POST /tai-khoan/resend-verification?email=...
POST /tai-khoan/quen-mat-khau?email=...
POST /tai-khoan/dat-lai-mat-khau
```

---

## 15. AdminLayout và thông báo

File:

```txt
components/admin/AdminLayout.jsx
```

Nhiệm vụ:

```txt
- Bọc giao diện admin
- Hiển thị sidebar
- Hiển thị tiêu đề trang
- Load danh sách thông báo
- Đánh dấu đã xem từng thông báo hoặc tất cả
```

API liên quan:

```txt
GET /ThongBao
GET /ThongBao/chua-xem
PUT /ThongBao/{idthongbao}/da-xem
PUT /ThongBao/da-xem-tat-ca
```

---

## 16. Bảng màn hình -> API chính

| Màn hình/file | API chính |
|---|---|
| `AdminDashboard.jsx` | `GET /Thongke?range=...` |
| `QuanLyDonHang.jsx` | `GET /Donhangs` |
| `ChiTietDonHang.jsx` | `GET /Donhangs`, `GET /Donhangs/{id}/chitiet`, `PUT /Donhangs/{id}/status`, `PUT /Donhangs/{id}/cap-nhat-can-nang` |
| `TaoDonHang.jsx` | `GET /tai-khoan`, `GET /Chitietcabans`, `GET /Donvitinhs`, `GET /Banggias`, `GET /Quydois`, `POST /Donhangs` |
| `QuanLyKho.jsx` | `GET /Chitietcabans` |
| `NhapHang.jsx` | `GET /Chitietcabans`, `GET /Nhacungcaps`, `GET /Banggias`, `POST /Phieunhaps` |
| `QuanLyCongNo.jsx` | `GET /CongNo`, `GET /tai-khoan`, `GET /CongNo/{id}/lich-su`, `PUT /CongNo/{id}/han-muc`, `PUT /CongNo/{id}/dieu-chinh`, `PUT /CongNo/{id}/mo-khoa` |
| `QuanLyThanhLy.jsx` | `GET /Phieuthanhlys`, `GET /Phieuthanhlys/tat-ca-lo-con-hang`, `POST /Phieuthanhlys` |
| `TaoPhieuThanhLy.jsx` | `GET /Chitietcabans`, `GET /Phieuthanhlys/lo-con-hang`, `POST /Phieuthanhlys` |
| `QuanLyLoaiCa.jsx` | `GET /Loaicas` |
| `ThemSuaLoaiCa.jsx` | `GET /Loaicas`, `GET /Sizecas`, `POST/PUT /Loaicas`, `POST /Sizecas`, `POST /Chitietcabans`, `POST /Quydois` |
| `KichCoLoaiCa.jsx` | `GET /Chitietcabans`, `GET /Sizecas`, `GET /Quydois`, `GET /Loaicas`, `POST /Sizecas`, `POST /Chitietcabans`, `POST /Quydois`, `DELETE /Chitietcabans/{id}` |
| `QuanLyBangGia.jsx` | `GET /Banggias` |
| `ThemBangGia.jsx` | `GET /Chitietcabans`, `POST /Banggias` |
| `QuanLyTaiKhoan.jsx` | `GET /tai-khoan`, `PUT /tai-khoan/{id}`, `PUT /tai-khoan/duyet/{id}` |
| `ThemSuaTaiKhoan.jsx` | `GET /tai-khoan`, `POST /tai-khoan`, `PUT /tai-khoan/{id}` |
| `product-detail.jsx` | `GET /Loaicas/{id}`, `GET /Banggias`, `GET /Quydois`, `GET /Chitietcabans`, `GET /Donvitinhs`, `POST /gio-hang/items` qua context |
| `cart.jsx` | Dùng `CartContext`: giỏ hàng, update, delete |
| `checkout.jsx` | `POST /Donhangs`, `POST /payment/create-payment` |
| `ThongTinDonHang.jsx` | `GET /Donhangs/my-orders`, `GET /Donhangs/{id}/chitiet`, `PUT /Donhangs/{id}/xac-nhan-nhan-hang`, `PUT /Donhangs/{id}/huy`, `GET /Thanhtoan/{id}/tinh-trang`, `POST /payment/create-payment` |
| `Profile.jsx` | `PUT /tai-khoan/{id}`, `PUT /tai-khoan/doi-mat-khau` |

---

## 17. File đang dài và nên refactor sau

Các file dài nhất hiện tại:

```txt
customer/ThongTinDonHang.jsx   ~646 dòng
admin/QuanLyCongNo.jsx         ~394 dòng
admin/QuanLyThanhLy.jsx        ~374 dòng
customer/product-detail.jsx    ~350 dòng
admin/TaoDonHang.jsx           ~343 dòng
customer/Profile.jsx           ~340 dòng
admin/NhapHang.jsx             ~302 dòng
auth/register.jsx              ~279 dòng
admin/ThemSuaLoaiCa.jsx        ~275 dòng
admin/KichCoLoaiCa.jsx         ~267 dòng
admin/TaoPhieuThanhLy.jsx      ~265 dòng
```

Gợi ý ưu tiên refactor:

```txt
1. ThongTinDonHang.jsx
2. QuanLyCongNo.jsx
3. QuanLyThanhLy.jsx
4. NhapHang.jsx
5. TaoPhieuThanhLy.jsx
6. product-detail.jsx
```

Không nên refactor tất cả cùng lúc. Mỗi lần chỉ tách 1 page.

---

## 18. Quy tắc refactor FE trong project này

Mục tiêu refactor:

```txt
- Giữ giao diện như cũ
- Giữ route như cũ
- Không đổi API nếu không cần
- Không sửa logic nghiệp vụ lớn khi chỉ đang dọn code
- Tách UI lớn thành component nhỏ
- Tách helper format/tính toán sang utils
- Tách constants trạng thái sang constants.js
```

Cấu trúc đề xuất cho mỗi page lớn:

```txt
pages/admin/<ten-man-hinh>.jsx
pages/admin/<ten-man-hinh-kebab-case>/
  components/
    Bang...
    BoLoc...
    Modal...
    TongKet...
  utils/
    dinhDang...
    xuLy...
  constants.js
```

Ví dụ:

```txt
pages/admin/quan-ly-cong-no/
  components/
    BangCongNo.jsx
    BoLocCongNo.jsx
    LichSuCongNoModal.jsx
    DieuChinhCongNoModal.jsx
  utils/
    dinhDangCongNo.js
    xuLyCongNo.js
  constants.js
```

Quy tắc đặt tên:

```txt
- Tên thư mục: tiếng Việt không dấu, kebab-case
- Tên component: tiếng Việt không dấu, PascalCase
- Tên utils: tiếng Việt không dấu, camelCase
```

---

## 19. Cách đọc một page React dài

Khi mở một file dài, đừng đọc JSX trước. Đọc theo thứ tự:

```txt
1. Import: page dùng context/component/API nào?
2. useState: page giữ những state gì?
3. useEffect: page load dữ liệu nào khi mở màn hình?
4. Các hàm fetch/submit/update/delete
5. Các biến derived: filter, total, statusLabel
6. JSX return: chia màn hình thành những vùng UI nào?
```

Câu hỏi cần trả lời:

```txt
- Màn hình này làm gì?
- Khi load gọi API nào?
- User bấm nút nào thì gọi hàm nào?
- Hàm đó gọi API nào?
- Thành công thì điều hướng/cập nhật state gì?
- Lỗi thì showToast gì?
```

---

## 20. Sơ đồ FE nên có trong luận văn

### 20.1 Sơ đồ cấu trúc giao diện

```txt
App
 ├── Auth Pages
 │    ├── Login
 │    ├── Register
 │    ├── Verify Email
 │    └── Reset Password
 │
 ├── CustomerLayout
 │    ├── Header
 │    ├── Home
 │    ├── ProductDetail
 │    ├── Cart
 │    ├── Checkout
 │    ├── MyOrders
 │    └── Footer
 │
 └── ProtectedRoute
      └── AdminLayout
           ├── AdminSidebar
           ├── Dashboard
           ├── QuanLyDonHang
           ├── TaoDonHang
           ├── QuanLyKho
           ├── NhapHang
           ├── QuanLyCongNo
           ├── QuanLyThanhLy
           └── QuanLyTaiKhoan
```

### 20.2 Sơ đồ navigation customer

```txt
/home
  -> /product-detail/:id
  -> /cart
  -> /checkout
  -> /order-success hoặc /order-failed
  -> /my-orders
```

### 20.3 Sơ đồ navigation admin

```txt
/admin
  -> /admin/QuanLyDonHang
      -> /admin/QuanLyDonHang/tao-don
      -> /admin/QuanLyDonHang/chi-tiet/:id
  -> /admin/QuanLyKho
      -> /admin/QuanLyKho/nhap-hang
  -> /admin/QuanLyCongNo
  -> /admin/QuanLyThanhLy
      -> /admin/QuanLyThanhLy/tao-phieu
  -> /admin/QuanLyLoaiCa
      -> /admin/QuanLyLoaiCa/them
      -> /admin/QuanLyLoaiCa/sua/:id
      -> /admin/QuanLyLoaiCa/kich-co/:loaicaId
```

### 20.4 Sequence FE-BE đặt hàng online

```txt
Customer
  -> ProductDetail.jsx
  -> CartContext.addToCart()
  -> POST /gio-hang/items
  -> Cart.jsx
  -> Checkout.jsx
  -> POST /Donhangs
  -> POST /payment/create-payment nếu chọn VNPAY
  -> OrderSuccess/OrderFailed
```

### 20.5 Sequence FE-BE admin tạo đơn POS

```txt
Admin
  -> TaoDonHang.jsx
  -> GET /tai-khoan, /Chitietcabans, /Donvitinhs, /Banggias, /Quydois
  -> chọn khách + sản phẩm
  -> POST /Donhangs
  -> hiển thị ManHinhHoanTatDonHang
```

---

## 21. Ghi chú về chất lượng code hiện tại

FE hiện tại **không phải là không thể đọc**, nhưng rối vì:

```txt
- Nhiều page quá dài
- UI và logic API trộn chung
- Ít component nhỏ
- Nhiều state trong cùng một file
- Điều kiện hiển thị nằm trực tiếp trong JSX
- Một số chuỗi/comment bị lỗi encoding tiếng Việt
```

Cách cải thiện:

```txt
- Tách bảng thành component riêng
- Tách modal thành component riêng
- Tách hàm format/tính toán ra utils
- Tách trạng thái/nhãn hiển thị ra constants
- Tạo README theo từng module
- Không refactor toàn bộ trong một lần
```

---

## 22. Checklist đọc FE trong 5 ngày

Nếu cần đọc nhanh để hiểu làm luận văn:

### Ngày 1 - Khung app

```txt
[ ] app-routes.jsx
[ ] axios.js
[ ] AuthContext.jsx
[ ] ProtectedRoute.jsx
[ ] AdminLayout.jsx
[ ] AdminSidebar.jsx
```

### Ngày 2 - Customer mua hàng

```txt
[ ] home.jsx
[ ] product-list.jsx
[ ] product-detail.jsx
[ ] CartContext.jsx
[ ] cart.jsx
[ ] checkout.jsx
```

### Ngày 3 - Customer đơn hàng/profile

```txt
[ ] ThongTinDonHang.jsx
[ ] OrderSuccess.jsx
[ ] OrderFailed.jsx
[ ] Profile.jsx
```

### Ngày 4 - Admin đơn/kho

```txt
[ ] QuanLyDonHang.jsx
[ ] TaoDonHang.jsx
[ ] ChiTietDonHang.jsx
[ ] QuanLyKho.jsx
[ ] NhapHang.jsx
```

### Ngày 5 - Admin công nợ/thanh lý/danh mục

```txt
[ ] QuanLyCongNo.jsx
[ ] QuanLyThanhLy.jsx
[ ] TaoPhieuThanhLy.jsx
[ ] QuanLyLoaiCa.jsx
[ ] ThemSuaLoaiCa.jsx
[ ] KichCoLoaiCa.jsx
[ ] QuanLyBangGia.jsx
[ ] ThemBangGia.jsx
[ ] QuanLyTaiKhoan.jsx
```

---

## 23. Kết luận

FE nên được hiểu theo hướng:

```txt
Route -> Page -> State -> API -> User action -> Kết quả
```

Không nên đọc theo hướng:

```txt
Mở file 600 dòng và đọc từ dòng 1 tới dòng cuối.
```

Để làm luận văn, chỉ cần nắm:

```txt
- Các màn hình chính
- Luồng điều hướng
- FE gọi API nào
- User thao tác gì
- BE trả dữ liệu gì
- FE hiển thị/cập nhật giao diện ra sao
```

Các chi tiết UI như màu sắc, padding, className Tailwind không phải trọng tâm khi trình bày luận văn.
