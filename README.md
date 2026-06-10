# Quản Lý Vựa Cá Điêu Hồng

Hệ thống quản lý vựa cá theo mô hình B2B — phục vụ việc nhập hàng, quản lý kho, thiết lập bảng giá và xử lý đơn hàng bán sỉ. Tài khoản khách hàng đăng ký phải qua xác thực email và được admin phê duyệt trước khi sử dụng.

## Công nghệ

**Backend**
- Java 21 / Spring Boot 3.5.7
- MySQL — lưu trữ chính
- Redis — blacklist JWT, token xác thực email
- Spring Security + JWT (cookie-based)
- Spring Mail — gửi email xác thực qua Gmail SMTP
- Cloudinary — lưu ảnh loại cá
- VNPay — thanh toán trực tuyến

**Frontend**
- React 18 + Vite
- Tailwind CSS
- React Router v6

## Cấu trúc thư mục

```
QuanLyVuaCa/
├── client/          # React + Vite
├── server/          # Spring Boot
└── docs/            # Tài liệu mô tả luồng nghiệp vụ
```

## Chạy dự án

### Yêu cầu
- Java 21+
- Node.js 18+
- MySQL 8
- Redis

### Backend

Tạo file `server/src/main/resources/application-local.yaml` (xem mẫu bên dưới), sau đó:

```bash
cd server
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

Server chạy tại `http://localhost:8080/quan-ly-vua-ca`

### Frontend

```bash
cd client
npm install
npm run dev
```

Client chạy tại `http://localhost:5173`

## Cấu hình local

Tạo file `server/src/main/resources/application-local.yaml`:

```yaml
spring:
  datasource:
    url: "jdbc:mysql://localhost:3306/quanlyvuaca"
    username: root
    password: root
  data:
    redis:
      host: localhost
      port: 6379
      password:
  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: "your-app-password"   # App Password 16 ký tự, không phải mật khẩu Gmail
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

jwt:
  signerKey: "your-secret-key"

frontend:
  url: http://localhost:5173

cloudinary:
  cloud-name:
  api-key:
  api-secret:

vnpay:
  tmn-code:
  hash-secret:
  base-url: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
  return-url: http://localhost:8080/quan-ly-vua-ca/payment/vnpay-callback

springdoc:
  swagger-ui:
    path: /swagger-ui.html
  api-docs:
    path: /api-docs
```

> App Password Gmail: bật 2FA tại myaccount.google.com, sau đó tạo App Password tại myaccount.google.com/apppasswords

## Tính năng chính

| Module | Mô tả |
|---|---|
| Đăng ký / Đăng nhập | Xác thực email + admin phê duyệt trước khi dùng được |
| Quản lý loại cá | Thêm/sửa loại cá, quản lý kích cỡ |
| Kho hàng | Theo dõi tồn kho, tạo phiếu nhập |
| Bảng giá | Thiết lập giá bán lẻ / bán sỉ theo từng loại và kích cỡ |
| Đơn hàng | Tạo đơn, cân đóng hàng, theo dõi trạng thái vận chuyển |
| Tài khoản | Phân quyền ADMIN / STAFF / CUSTOMER, khóa/mở tài khoản |

## Tài khoản mặc định

```
Email:    admin@gmail.com
Mật khẩu: 123456789
Vai trò:  ADMIN
```
