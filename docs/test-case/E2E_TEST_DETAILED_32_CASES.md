# Báo cáo kết quả kiểm thử chức năng đăng nhập

**Dự án:** Quản Lý Vựa Cá  
**Ngày kiểm thử:** 21/07/2026  
**Công cụ:** Playwright  
**Trình duyệt:** Chrome  
**Tổng số test case:** 32  
**Kết quả:** 32 đạt, 0 không đạt

## Bảng kết quả kiểm thử

| STT | Nội dung kiểm tra | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---:|---|---|---|:---:|
| 1 | Hiển thị màn hình đăng nhập | Hiển thị đầy đủ tiêu đề, email, mật khẩu, nút đăng nhập và liên kết đăng ký | Các thành phần hiển thị đầy đủ | Đạt |
| 2 | Gửi biểu mẫu khi chưa nhập dữ liệu | Hiển thị yêu cầu nhập email và mật khẩu | Thông báo lỗi hiển thị đúng | Đạt |
| 3 | Chỉ nhập email | Không cho đăng nhập và yêu cầu nhập đủ thông tin | Thông báo lỗi hiển thị đúng | Đạt |
| 4 | Chỉ nhập mật khẩu | Không cho đăng nhập và yêu cầu nhập đủ thông tin | Thông báo lỗi hiển thị đúng | Đạt |
| 5 | Hiện và ẩn mật khẩu | Có thể chuyển đổi giữa dạng ẩn và dạng hiển thị | Mật khẩu được hiện và ẩn đúng | Đạt |
| 6 | Trạng thái xử lý khi đăng nhập | Hiển thị biểu tượng đang xử lý trong lúc chờ phản hồi | Trạng thái đang xử lý hiển thị đúng | Đạt |
| 7 | Lỗi thông tin đăng nhập không chính xác | Hiển thị thông báo lỗi phù hợp | Thông báo lỗi hiển thị đúng | Đạt |
| 8 | Chuyển đến trang đăng ký | Mở đúng trang đăng ký | Điều hướng đến `/register` | Đạt |
| 9 | Nhấn vào logo | Quay về trang chủ | Điều hướng về trang chủ | Đạt |
| 10 | Mất kết nối mạng khi đăng nhập | Hiển thị thông báo lỗi chung, không làm hỏng giao diện | Lỗi được xử lý và hiển thị đúng | Đạt |
| 11 | Nhập lại dữ liệu sau khi có lỗi | Thông báo lỗi cũ được xóa | Thông báo lỗi được xóa khi nhập lại | Đạt |
| 12 | Gửi biểu mẫu bằng phím Enter | Thực hiện đăng nhập như khi nhấn nút | Biểu mẫu được gửi và điều hướng đúng | Đạt |
| 13 | Nút đăng nhập trong lúc xử lý | Nút bị vô hiệu hóa để tránh thao tác lặp | Nút bị vô hiệu hóa đúng | Đạt |
| 14 | Email chưa được xác thực | Hiển thị yêu cầu xác thực email | Thông báo tương ứng mã lỗi 1030 hiển thị đúng | Đạt |
| 15 | Tài khoản đang chờ phê duyệt | Hiển thị trạng thái chờ quản trị viên phê duyệt | Thông báo tương ứng mã lỗi 1031 hiển thị đúng | Đạt |
| 16 | Tài khoản bị khóa | Thông báo tài khoản bị khóa | Thông báo tương ứng mã lỗi 1028 hiển thị đúng | Đạt |
| 17 | API trả lỗi 401 | Thông báo email hoặc mật khẩu không chính xác | Thông báo lỗi 401 hiển thị đúng | Đạt |
| 18 | Quản trị viên đăng nhập thành công | Chuyển đến trang quản trị | Điều hướng đến `/admin` | Đạt |
| 19 | Nhân viên đăng nhập thành công | Chuyển đến trang quản lý đơn hàng | Điều hướng đến `/admin/QuanLyDonHang` | Đạt |
| 20 | Khách hàng đăng nhập thành công | Chuyển đến trang chủ khách hàng | Điều hướng đến `/home` | Đạt |
| 21 | Nhấn “Quên mật khẩu?” | Chuyển đến trang quên mật khẩu | Điều hướng đến `/quen-mat-khau` | Đạt |
| 22 | Điền nhanh tài khoản quản trị viên | Email và mật khẩu mẫu được điền đúng | Dữ liệu mẫu được điền đầy đủ | Đạt |
| 23 | API trả trạng thái chưa xác thực đăng nhập | Hiển thị thông báo đăng nhập thất bại | Lỗi được hiển thị đúng | Đạt |
| 24 | API đăng nhập gặp lỗi máy chủ | Hiển thị thông báo thử lại sau | Thông báo lỗi chung hiển thị đúng | Đạt |
| 25 | Không tải được thông tin người dùng sau đăng nhập | Không điều hướng sai và hiển thị lỗi | Hệ thống giữ nguyên trang và hiển thị lỗi | Đạt |
| 26 | Nhấn đăng nhập nhiều lần liên tục | Chỉ gửi một yêu cầu đăng nhập | Hệ thống chỉ gửi một yêu cầu | Đạt |
| 27 | Thông báo đăng nhập thành công | Hiển thị toast thành công | Toast “Đăng nhập thành công” hiển thị đúng | Đạt |
| 28 | Thông báo đăng nhập thất bại | Hiển thị toast lỗi phù hợp | Toast lỗi hiển thị đúng | Đạt |
| 29 | Người dùng có vai trò không xác định | Điều hướng về trang mặc định an toàn | Điều hướng đến `/home` | Đạt |
| 30 | Email sai định dạng | Không gửi yêu cầu đăng nhập | Trình duyệt chặn biểu mẫu, không gửi request | Đạt |
| 31 | Mật khẩu chứa ký tự đặc biệt và Unicode | Giữ nguyên dữ liệu khi gửi đến API | Mật khẩu được gửi đầy đủ, không bị thay đổi | Đạt |
| 32 | Sử dụng bàn phím và nhãn truy cập | Các trường và nút có thể nhận diện, focus đúng thứ tự | Nhãn và thứ tự focus hoạt động đúng | Đạt |

## Tổng hợp kết quả

| Nội dung | Kết quả |
|---|---:|
| Tổng số test case | 32 |
| Đạt | 32 |
| Không đạt | 0 |
| Tỷ lệ đạt | 100% |

## Kết luận

Chức năng đăng nhập đáp ứng các nội dung đã kiểm tra trên trình duyệt Chrome, gồm hiển thị giao diện, kiểm tra dữ liệu đầu vào, xử lý lỗi, điều hướng theo vai trò và các tình huống sử dụng bổ sung. Tại thời điểm kiểm thử, không ghi nhận test case không đạt.
