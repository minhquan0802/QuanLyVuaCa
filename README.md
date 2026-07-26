# Quản Lý Vựa Cá Điêu Hồng

Hệ thống website thương mại điện tử kết hợp quản lý vận hành cho vựa cá, phục vụ khách lẻ, khách sỉ và hoạt động bán hàng trực tiếp tại quầy. Hệ thống hỗ trợ quản lý sản phẩm, bảng giá, kho và lô hàng, đơn hàng, thanh toán, công nợ, thanh lý, thông báo và thống kê kinh doanh.

Tài khoản khách hàng đăng ký trực tuyến phải xác thực email và được quản trị viên phê duyệt trước khi sử dụng đầy đủ chức năng.

## Công nghệ

### Backend

- Java 21, Spring Boot 3.5.7.
- Spring Web, Spring Data JPA và MySQL 8.
- Spring Security và JWT lưu bằng HttpOnly cookie.
- Redis lưu token bị vô hiệu hóa và token xác thực email.
- Spring Mail gửi email xác thực và đặt lại mật khẩu.
- Server-Sent Events (SSE) gửi thông báo thời gian thực.
- Cloudinary lưu trữ hình ảnh loại cá.
- VNPay xử lý thanh toán trực tuyến.
- SpringDoc OpenAPI cung cấp tài liệu API.
- JUnit 5 và Mockito kiểm thử Backend.

### Frontend

- React 19.
- Vite 6.
- Tailwind CSS 4.
- React Router DOM 7.
- Axios giao tiếp với Backend.
- Recharts hiển thị biểu đồ Dashboard.
- Playwright kiểm thử End-to-End.

## Cấu trúc thư mục

```text
QuanLyVuaCa/
├── client/          # Frontend React + Vite
├── server/          # Backend Spring Boot
├── docs/            # Tài liệu nghiệp vụ và kiểm thử
└── README.md
```

## Yêu cầu môi trường

- Java 21 trở lên.
- Node.js 18 trở lên.
- MySQL 8.
- Redis.
- Maven Wrapper đi kèm dự án.

## Chuẩn bị cơ sở dữ liệu

Tạo database MySQL:

```sql
CREATE DATABASE quanlyvuaca
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;
```

Sau đó import bản schema và dữ liệu phù hợp với phiên bản code hiện tại.

Backend sử dụng:

```yaml
spring.jpa.hibernate.ddl-auto: validate
```

Do đó, Hibernate chỉ kiểm tra cấu trúc và không tự tạo hoặc tự cập nhật bảng. Ứng dụng sẽ không khởi động nếu database thiếu bảng/cột, còn sử dụng tên bảng cũ hoặc không đúng ràng buộc được khai báo trong Entity.

Phiên bản hiện tại không còn bảng `quydoikhoiluong`. Trường `sokgtuongung` được lưu trực tiếp trong bảng `chitietsanpham`.

## Cấu hình Backend local

Tạo file không được đưa lên Git:

```text
server/src/main/resources/application-local.yaml
```

Nội dung tham khảo:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/quanlyvuaca
    username: root
    password: root
  data:
    redis:
      host: localhost
      port: 6379
      password:
      ssl:
        enabled: false
  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: your-app-password
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

jwt:
  signerKey: your-secret-key-with-sufficient-length

# Local chạy HTTP nên phải ghi đè cấu hình cookie production.
cookie:
  secure: false
  same-site: Lax

frontend:
  url: http://localhost:5173

cloudinary:
  cloud-name: your-cloud-name
  api-key: your-api-key
  api-secret: your-api-secret

vnpay:
  tmn-code: your-tmn-code
  hash-secret: your-hash-secret
  base-url: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
  return-url: http://localhost:8080/quan-ly-vua-ca/payment/vnpay-callback

springdoc:
  swagger-ui:
    path: /swagger-ui.html
  api-docs:
    path: /api-docs
```

Mật khẩu Gmail trong cấu hình phải là App Password, không phải mật khẩu đăng nhập Gmail. Không commit email, mật khẩu, JWT secret, Cloudinary secret hoặc VNPay secret lên Git.

## Cấu hình Frontend local

Tạo file không được đưa lên Git:

```text
client/.env.local
```

Nội dung tham khảo:

```env
VITE_BE_URL=http://localhost:8080/quan-ly-vua-ca

# Thông tin dùng để tạo mã VietQR khi khách chọn chuyển khoản.
VITE_BANK_ID=MB
VITE_BANK_ACCOUNT=0123456789
VITE_BANK_NAME=SHOP VUA CA
```

`VITE_BE_URL` là bắt buộc. Ba biến ngân hàng cần được thay bằng thông tin thực tế trước khi triển khai.

## Chạy dự án

### Khởi động Redis

Bảo đảm Redis đang chạy và có thông tin kết nối khớp với `application-local.yaml`.

### Khởi động Backend

Windows PowerShell:

```powershell
cd server
.\mvnw.cmd clean spring-boot:run "-Dspring-boot.run.profiles=local"
```

Linux/macOS/Git Bash:

```bash
cd server
./mvnw clean spring-boot:run -Dspring-boot.run.profiles=local
```

Lệnh `clean` giúp xóa các file `.class` cũ trong `target`, đặc biệt cần thiết sau khi xóa hoặc đổi tên Entity.

Backend chạy tại:

```text
http://localhost:8080/quan-ly-vua-ca
```

### Khởi động Frontend

```bash
cd client
npm install
npm run dev
```

Frontend chạy tại:

```text
http://localhost:5173
```

## Tài liệu API

Khi Backend đang chạy với cấu hình mẫu:

- Swagger UI: `http://localhost:8080/quan-ly-vua-ca/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/quan-ly-vua-ca/api-docs`

## Tính năng chính

| Module | Mô tả |
|---|---|
| Xác thực | Đăng ký, xác thực email, đăng nhập, refresh token, đăng xuất và đặt lại mật khẩu |
| Phân quyền | Phân quyền `ADMIN`, `STAFF`, `CUSTOMER` trên cả giao diện và Backend |
| Sản phẩm | Quản lý loại cá, kích thước, chi tiết cá bán và số kg tương ứng |
| Bảng giá | Thiết lập giá bán lẻ, giá bán sỉ theo khoảng thời gian hiệu lực |
| Giỏ hàng | Thêm, cập nhật số lượng và xóa sản phẩm trong giỏ |
| Đặt hàng online | Khách hàng đặt hàng và theo dõi trạng thái xử lý |
| Bán hàng POS | Admin/Staff tạo đơn tại quầy cho khách lẻ hoặc khách sỉ |
| Quản lý đơn hàng | Xác nhận, đóng hàng, cập nhật kg thực tế, vận chuyển, hoàn thành hoặc hủy đơn |
| Kho và nhập hàng | Tạo phiếu nhập, quản lý lô hàng và tồn kho tổng |
| Thanh lý | Bán thanh lý hoặc tiêu hủy lô hàng, đồng bộ tồn lô và tồn kho tổng |
| Thanh toán | Tiền mặt, chuyển khoản thủ công và thanh toán trực tuyến qua VNPay |
| Công nợ | Hạn mức tín dụng, tăng/giảm nợ, khóa đặt hàng và lịch sử công nợ khách sỉ |
| Thông báo | Gửi và nhận thông báo thời gian thực bằng SSE |
| Dashboard | Doanh thu đơn hàng, thu thanh lý, chi phí nhập, lô quá hạn, luân chuyển hàng hóa và đơn hàng trong kỳ |

## Chạy kiểm thử

### Backend

Windows PowerShell:

```powershell
cd server
.\mvnw.cmd test
```

Linux/macOS/Git Bash:

```bash
cd server
./mvnw test
```

Test khởi tạo toàn bộ Spring ApplicationContext cần đầy đủ cấu hình môi trường hoặc profile test tương ứng.

### Frontend End-to-End

Cài trình duyệt Playwright trong lần chạy đầu:

```bash
cd client
npm install
npx playwright install chromium
```

Chạy test:

```bash
npm test
```

Các chế độ khác:

```bash
npm run test:ui
npm run test:headed
npm run test:debug
```

## Tài khoản quản trị mặc định

Khi database chưa có tài khoản quản trị mặc định, Backend sẽ tạo:

```text
Email:    admin@gmail.com
Mật khẩu: 123456789
Vai trò:  ADMIN
```

Tài khoản này chỉ dùng trong môi trường phát triển hoặc demo. Phải đổi mật khẩu trước khi triển khai thực tế.

## Lưu ý bảo mật

- Không commit các file `.env.local` và `application-local.yaml`.
- Không đưa mật khẩu, JWT secret, Cloudinary secret hoặc VNPay secret vào mã nguồn.
- Không dựa vào việc ẩn nút trên Frontend để phân quyền; các thao tác quan trọng phải được kiểm tra tại Backend.
- Luôn kiểm tra lại giá, tồn kho, hạn mức tín dụng và trạng thái đơn hàng tại Backend.
