# QuanLyVuaCa - Client

Giao diện người dùng (Frontend) của hệ thống quản lý vựa cá, xây dựng bằng React.

## Giới thiệu

Ứng dụng web hỗ trợ hai nhóm người dùng:

- **Khách hàng**: Duyệt sản phẩm, thêm vào giỏ hàng, đặt hàng và theo dõi đơn hàng.
- **Quản trị viên**: Quản lý toàn bộ hệ thống thông qua bảng điều khiển admin.

## Công nghệ sử dụng

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| React | 19 | Thư viện UI chính |
| React Router DOM | 7 | Điều hướng trang |
| Recharts | 3 | Biểu đồ thống kê (Admin Dashboard) |
| Tailwind CSS | 3 | Styling |

## Cấu trúc trang

### Trang công khai
| Đường dẫn | Trang |
|---|---|
| `/` | Đăng nhập |
| `/register` | Đăng ký tài khoản |

### Trang người dùng (yêu cầu đăng nhập)
| Đường dẫn | Trang |
|---|---|
| `/home` | Trang chủ - danh sách sản phẩm |
| `/product-detail/:product_id` | Chi tiết sản phẩm |
| `/cart` | Giỏ hàng |
| `/checkout` | Thanh toán |
| `/profile` | Thông tin cá nhân |
| `/my-orders` | Lịch sử đơn hàng |
| `/order-success` | Đặt hàng thành công |
| `/order-failed` | Đặt hàng thất bại |

### Trang quản trị viên (yêu cầu quyền Admin)
| Đường dẫn | Trang |
|---|---|
| `/admin` | Dashboard - thống kê tổng quan |
| `/admin/QuanLyLoaiCa` | Quản lý loại cá |
| `/admin/QuanLyBangGia` | Quản lý bảng giá |
| `/admin/QuanLyKho` | Quản lý kho hàng |
| `/admin/QuanLyDonHang` | Quản lý đơn hàng |
| `/admin/QuanLyTaiKhoan` | Quản lý tài khoản |

## Cài đặt và chạy

### Yêu cầu
- Node.js >= 16

### Cài đặt dependencies

```bash
npm install
```

### Chạy môi trường development

```bash
npm start
```

Ứng dụng chạy tại [http://localhost:3000](http://localhost:3000).

### Build production

```bash
npm run build
```

Output nằm trong thư mục `build/`.

## Cấu trúc thư mục

```
src/
├── components/         # Các component dùng chung
│   ├── admin/          # Layout và Sidebar cho trang Admin
│   ├── header.js
│   ├── footer.js
│   └── product-list.js
├── pages/              # Các trang của ứng dụng
│   ├── admin/          # Các trang quản trị
│   └── ...             # Các trang người dùng
├── routes/             # Cấu hình điều hướng và bảo vệ route
│   ├── app-routes.js
│   ├── PrivateAdminRoute.js
│   └── ProtectedRoute.js
└── utils/
    └── fetchAPI.js     # Tiện ích gọi API
```
