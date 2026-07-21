# Báo cáo E2E cho chức năng đăng nhập

**Dự án:** Quản Lý Vựa Cá  
**Ngày:** 21/07/2026  
**Công cụ:** Playwright  
**Phạm vi trình duyệt:** Chỉ Chrome  
**Kết quả cuối:** 32/32 test pass

## Tóm tắt

Bộ test đăng nhập hiện có 32 test case duy nhất và chỉ chạy trên project `chrome`. Cấu hình Firefox và WebKit đã được xóa để đúng phạm vi kiểm thử hiện tại.

```text
32 test case × 1 trình duyệt Chrome = 32 lượt chạy
```

## Cấu trúc test suite

| Test suite | Số test | Nội dung |
|---|---:|---|
| Login Page - Authentication | 13 | Form, validation, loading, bàn phím và điều hướng |
| Login Page - Error Scenarios | 4 | Mã lỗi 1030, 1031, 1028 và 401 |
| Login Page - Successful Login | 3 | Điều hướng ADMIN, STAFF và CUSTOMER |
| Login Page - Additional Scenarios | 12 | API biên, toast, chống gửi trùng, dữ liệu đặc biệt và accessibility |
| **Tổng** | **32** | |

## Phạm vi và kết quả kiểm thử

| Phạm vi kiểm tra | Kết quả |
|---|---|
| Hiển thị và thao tác trên biểu mẫu đăng nhập | Đạt |
| Kiểm tra dữ liệu email và mật khẩu | Đạt |
| Xử lý lỗi đăng nhập và lỗi hệ thống | Đạt |
| Điều hướng sau đăng nhập theo từng vai trò | Đạt |
| Trạng thái xử lý và ngăn gửi yêu cầu trùng | Đạt |
| Thông báo thành công và thất bại | Đạt |
| Hỗ trợ bàn phím và nhãn truy cập | Đạt |

## Thay đổi hỗ trợ kiểm thử

- Ô email sử dụng `type="email"` để Chrome xác thực định dạng.
- Email và mật khẩu có `id`/`htmlFor` để hỗ trợ nhãn truy cập.
- Nút hiện/ẩn mật khẩu có `title` và `aria-label` động.
- Thông báo lỗi trong form được xóa khi người dùng nhập lại.
- Liên kết đăng ký không còn tạo URL có ký tự `#`.
- Axios không thử refresh token khi chính request `/auth/token` trả 401.
- Các mock Playwright dùng `route.fulfill()` và selector tách biệt form/toast.

## Cấu hình trình duyệt

`client/playwright.config.js` chỉ còn một project:

```javascript
projects: [
  {
    name: 'chrome',
    use: { ...devices['Desktop Chrome'] },
  },
]
```

Project sử dụng cấu hình Desktop Chrome trên Chrome for Testing/Chromium do Playwright quản lý. Firefox và WebKit không được chạy.

## Lệnh chạy

```bash
cd client
npm test
```

Hoặc:

```bash
npx playwright test --project=chrome
```

## Kết quả thực thi

Lần chạy xác minh cuối cùng:

```text
Running 32 tests using 4 workers
32 passed (11.2s)
```

Chi tiết từng test nằm trong `E2E_TEST_DETAILED_32_CASES.md`.
