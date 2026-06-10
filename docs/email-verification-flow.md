# Luồng Xác Thực Email Khi Đăng Ký Tài Khoản

## Tổng quan

Hệ thống B2B yêu cầu 2 bước xác minh trước khi tài khoản hoạt động:
1. **Người dùng** xác thực email qua link gửi về hộp thư
2. **Admin** phê duyệt tài khoản trong trang quản lý

---

## Trạng thái tài khoản

```
Đăng ký  →  CHO_XAC_THUC_EMAIL  →  CHO_DUYET  →  HOAT_DONG
              (chờ click link)      (chờ admin)    (dùng được)
```

| Trạng thái | Ý nghĩa | Đăng nhập được không |
|---|---|:---:|
| `CHO_XAC_THUC_EMAIL` | Vừa đăng ký, chưa click link email | ❌ |
| `CHO_DUYET` | Đã xác thực email, chờ admin duyệt | ❌ |
| `HOAT_DONG` | Admin đã duyệt, tài khoản bình thường | ✅ |
| `KHOA` | Bị admin khóa | ❌ |

---

## Bước 1 — Đăng ký tài khoản

**Endpoint:** `POST /tai-khoan`

**File:** `TaiKhoanService.java` → method `taoTaiKhoan()`

```
Người dùng gửi form đăng ký
        ↓
Kiểm tra email đã tồn tại chưa
        ↓
Lưu tài khoản vào DB  (status = CHO_XAC_THUC_EMAIL)
        ↓
Tạo token ngẫu nhiên  (UUID, vd: "a1b2c3d4-...")
        ↓
Lưu vào Redis:
  key   = "email_verify:a1b2c3d4-..."
  value = "user@gmail.com"
  TTL   = 24 giờ (tự động xóa sau 24h)
        ↓
Gửi email chứa link:
  http://localhost:5173/xac-thuc-email?token=a1b2c3d4-...
        ↓
Trả về 200 OK
```

> **Lưu ý:** Nếu gửi email thất bại, tài khoản vẫn được tạo và token vẫn còn trong Redis.
> Người dùng có thể nhấn **"Gửi lại email xác thực"** ngay trên trang đăng ký để nhận link mới.

---

## Gửi lại email xác thực

**Endpoint:** `POST /tai-khoan/resend-verification?email=user@gmail.com`

**File BE:** `TaiKhoanService.java` → method `guiLaiEmailXacThuc()`

```
Nhận email từ query param
        ↓
Tìm tài khoản theo email
        ↓
Kiểm tra status có phải CHO_XAC_THUC_EMAIL không
(nếu không → báo lỗi, tránh spam link cho tài khoản đã xác thực)
        ↓
Tạo token mới → ghi đè vào Redis (TTL reset về 24h)
        ↓
Gửi email với link mới
```

Nút gửi lại xuất hiện ở 2 nơi:
- Trang đăng ký sau khi submit thành công
- Trang xác thực (`/xac-thuc-email`) khi link bị lỗi/hết hạn

---

## Bước 2 — Xác thực email

**Người dùng click link trong email → trình duyệt mở trang `/xac-thuc-email?token=...`**

**File FE:** `XacThucEmail.jsx` → tự động gọi API khi trang load

**Endpoint:** `GET /tai-khoan/verify-email?token=a1b2c3d4-...`

**File BE:** `TaiKhoanService.java` → method `xacThucEmail()`

```
Nhận token từ query param
        ↓
Tra Redis: GET "email_verify:a1b2c3d4-..."
        ↓ (nếu null → token hết hạn hoặc sai → báo lỗi)
        ↓ (nếu có → lấy ra email)
        ↓
Tìm tài khoản theo email trong DB
        ↓
Kiểm tra status có phải CHO_XAC_THUC_EMAIL không
        ↓
Cập nhật status → CHO_DUYET
        ↓
Xóa token khỏi Redis (DEL "email_verify:a1b2c3d4-...")
        ↓
Trả về "Xác thực thành công, chờ admin phê duyệt"
```

---

## Bước 3 — Admin phê duyệt

**Admin vào trang Quản Lý Tài Khoản → thấy badge "Chờ duyệt" → nhấn nút "Phê duyệt"**

**File FE:** `QuanLyTaiKhoan.jsx` → method `handleApprove()`

**Endpoint:** `PUT /tai-khoan/duyet/{id}`

**File BE:** `TaiKhoanService.java` → method `duyetTaiKhoan()`

```
Admin nhấn nút "Phê duyệt"
        ↓
Tìm tài khoản theo id
        ↓
Kiểm tra status có phải CHO_DUYET không
        ↓
Cập nhật status → HOAT_DONG
        ↓
Trả về thông tin tài khoản đã duyệt
```

---

## Tại sao dùng Redis để lưu token?

| | Redis | Database |
|---|---|---|
| **Tốc độ** | RAM → rất nhanh | Disk → chậm hơn |
| **Tự hết hạn** | TTL tự động xóa sau 24h | Phải viết cronjob dọn dẹp |
| **Độ phức tạp** | Không cần thêm bảng/cột | Phải thêm cột `verify_token`, `token_expiry` |

---

## Sơ đồ đầy đủ

```
[FE Register]
     │  POST /tai-khoan
     ▼
[TaiKhoanService.taoTaiKhoan()]
     │  1. Lưu DB  (CHO_XAC_THUC_EMAIL)
     │  2. Lưu Redis  email_verify:{token} = email  TTL 24h
     │  3. Gửi Gmail  link xác thực
     ▼
[Gmail của user]
     │  Click link
     ▼
[FE XacThucEmail.jsx]
     │  GET /tai-khoan/verify-email?token=...
     ▼
[TaiKhoanService.xacThucEmail()]
     │  1. Đọc Redis → lấy email
     │  2. Cập nhật DB  (CHO_DUYET)
     │  3. Xóa token khỏi Redis
     ▼
[FE QuanLyTaiKhoan.jsx - Admin]
     │  PUT /tai-khoan/duyet/{id}
     ▼
[TaiKhoanService.duyetTaiKhoan()]
     │  Cập nhật DB  (HOAT_DONG)
     ▼
[User đăng nhập được]
```

---

## Xử lý lỗi khi đăng nhập

| Error code | Thông báo hiển thị |
|---|---|
| `1030` | Email chưa được xác thực. Vui lòng kiểm tra hộp thư. |
| `1031` | Tài khoản đang chờ quản trị viên phê duyệt. |
| `1028` | Tài khoản đã bị khóa. Liên hệ quản trị viên. |

---

## Cấu hình Gmail SMTP

**File:** `application-local.yaml`

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587                    # SMTP Submission (chuẩn hiện đại)
    username: your@gmail.com
    password: "xxxxxxxxxxxxxxxx" # App Password 16 ký tự, KHÔNG dùng mật khẩu Gmail
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true         # Kết nối thường → nâng cấp TLS giữa chừng
```

> **Tạo App Password:** https://myaccount.google.com/apppasswords
> (Yêu cầu bật 2FA trước)
