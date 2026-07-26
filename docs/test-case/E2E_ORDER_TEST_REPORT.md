# Báo cáo kết quả kiểm thử chức năng đặt hàng

**Dự án:** Quản Lý Vựa Cá  
**Ngày kiểm thử:** 21/07/2026  
**Công cụ:** Playwright  
**Trình duyệt:** Chrome  
**Tổng số test case:** 38  
**Kết quả:** 38 đạt, 0 không đạt

## Bảng kết quả kiểm thử

| STT | Nội dung kiểm tra | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---:|---|---|---|:---:|
| 1 | Thêm sản phẩm hợp lệ vào giỏ | Sản phẩm được thêm với đúng mã, đơn vị và số lượng | Dữ liệu gửi đúng, hiển thị thông báo thành công | Đạt |
| 2 | Thêm cùng sản phẩm nhiều lần | Mỗi thao tác hợp lệ được hệ thống tiếp nhận | Hai yêu cầu thêm sản phẩm được xử lý đúng | Đạt |
| 3 | Thêm hai kích cỡ của cùng sản phẩm | Hai kích cỡ được phân biệt theo mã chi tiết | Gửi đúng hai mã chi tiết sản phẩm | Đạt |
| 4 | Thay đổi số lượng trong giỏ | Số lượng và giỏ hàng được cập nhật | Số lượng tăng và giao diện cập nhật đúng | Đạt |
| 5 | Xóa một sản phẩm | Chỉ sản phẩm được chọn bị xóa | Sản phẩm còn lại vẫn hiển thị | Đạt |
| 6 | Xóa toàn bộ sản phẩm | Giỏ hàng chuyển về trạng thái trống | Hiển thị giỏ hàng trống | Đạt |
| 7 | Tính thành tiền sản phẩm | Thành tiền hiển thị đúng theo dữ liệu giỏ hàng | Thành tiền hiển thị đúng | Đạt |
| 8 | Tính tổng tiền đơn hàng | Tổng tiền bằng tổng các sản phẩm | Tổng tiền hiển thị đúng | Đạt |
| 9 | Số lượng bằng 0, âm hoặc không hợp lệ | Không cho nhập số lượng không hợp lệ | Số lượng tối thiểu được giữ ở mức 1 | Đạt |
| 10 | Số lượng vượt tồn kho | Không thêm sản phẩm vượt tồn kho | Hệ thống từ chối và hiển thị lỗi | Đạt |
| 11 | Sản phẩm hết hàng | Không cho thêm vào giỏ | Nút mua bị vô hiệu hóa | Đạt |
| 12 | Người dùng chưa đăng nhập | Yêu cầu đăng nhập trước khi đặt hàng | Hiển thị thông báo yêu cầu đăng nhập | Đạt |
| 13 | Thanh toán khi giỏ hàng trống | Không chuyển sang checkout | Giữ nguyên trang giỏ và hiển thị cảnh báo | Đạt |
| 14 | Thiếu họ tên người nhận | Không tạo đơn và yêu cầu nhập đủ thông tin | Hiển thị thông báo đúng | Đạt |
| 15 | Thiếu số điện thoại | Không tạo đơn và yêu cầu nhập đủ thông tin | Hiển thị thông báo đúng | Đạt |
| 16 | Số điện thoại sai định dạng | Không gửi yêu cầu tạo đơn | Hiển thị lỗi số điện thoại | Đạt |
| 17 | Thiếu địa chỉ nhận hàng | Không tạo đơn và yêu cầu nhập đủ thông tin | Hiển thị thông báo đúng | Đạt |
| 18 | Tạo đơn với dữ liệu hợp lệ | Đơn được tạo và chuyển đến danh sách đơn | Điều hướng đến `/my-orders` | Đạt |
| 19 | Danh sách sản phẩm trong đơn | Gửi đúng sản phẩm, đơn vị và số lượng | Payload chi tiết đơn hàng chính xác | Đạt |
| 20 | Tổng tiền tại thời điểm đặt | Tổng tiền checkout khớp giỏ hàng | Tổng tiền hiển thị đúng | Đạt |
| 21 | Khách hàng của đơn hàng | Đơn được gán đúng tài khoản đặt hàng | Gửi đúng ID khách hàng | Đạt |
| 22 | Trạng thái ban đầu của đơn | Đơn mới ở trạng thái chờ xác nhận | Phản hồi đơn mới được xử lý đúng | Đạt |
| 23 | Dữ liệu phục vụ cập nhật tồn kho | Backend nhận đúng mã hàng và số lượng | Dữ liệu chi tiết gửi đúng | Đạt |
| 24 | Xóa giỏ sau khi đặt thành công | Giỏ hàng được xóa một lần | API xóa giỏ được gọi đúng một lần | Đạt |
| 25 | Thông báo đặt hàng thành công | Hiển thị thông báo thành công | Toast thành công hiển thị đúng | Đạt |
| 26 | Nhấn nút đặt hàng liên tục | Chỉ tạo một đơn hàng | Chỉ một request tạo đơn được gửi | Đạt |
| 27 | Giá thay đổi trước khi xác nhận | Không tạo đơn với giá cũ, hiển thị lỗi | Thông báo thay đổi giá hiển thị đúng | Đạt |
| 28 | Tồn kho thay đổi khi checkout | Không tạo đơn vượt tồn kho mới | Thông báo thiếu tồn kho hiển thị đúng | Đạt |
| 29 | Hai khách cùng đặt lượng hàng còn lại | Xử lý xung đột và không tạo đơn sai | Thông báo xung đột tồn kho hiển thị đúng | Đạt |
| 30 | API tạo đơn gặp lỗi | Không điều hướng sai, hiển thị lỗi | Thông báo lỗi API hiển thị đúng | Đạt |
| 31 | Mất mạng khi tạo đơn | Không làm hỏng giao diện, hiển thị lỗi | Lỗi kết nối được xử lý đúng | Đạt |
| 32 | Tạo đơn thất bại | Không xóa giỏ hàng | API xóa giỏ không được gọi | Đạt |
| 33 | Xem đơn hàng của khách | Chỉ gọi API danh sách đơn của tài khoản hiện tại | Sử dụng đúng endpoint `/Donhangs/my-orders` | Đạt |
| 34 | Hủy đơn chờ xác nhận | Cho phép hủy và cập nhật trạng thái | Đơn chuyển sang “Đã hủy” | Đạt |
| 35 | Hủy đơn đã giao | Không hiển thị thao tác hủy | Nút hủy không xuất hiện | Đạt |
| 36 | Hoàn kho khi hủy đơn | Gửi đúng yêu cầu hủy để backend xử lý hoàn kho | Endpoint hủy được gọi đúng một lần | Đạt |
| 37 | Đặt hàng thanh toán sau | Gửi đúng dấu hiệu nghiệp vụ công nợ | Ghi chú chứa `[THANH_TOAN_SAU]` | Đạt |
| 38 | Trang thanh toán thành công và thất bại | Hiển thị đúng kết quả và điều hướng quay lại | Hai trang và thao tác điều hướng hoạt động đúng | Đạt |

## Tổng hợp kết quả

| Nhóm kiểm thử | Số lượng | Đạt | Không đạt |
|---|---:|---:|---:|
| Sản phẩm và giỏ hàng | 13 | 13 | 0 |
| Checkout và tạo đơn | 19 | 19 | 0 |
| Lịch sử, hủy đơn và thanh toán | 6 | 6 | 0 |
| **Tổng cộng** | **38** | **38** | **0** |

**Tỷ lệ đạt:** 100%

## Kết luận

Chức năng đặt hàng đáp ứng các nội dung đã kiểm tra trên Chrome, gồm chọn sản phẩm, quản lý giỏ hàng, nhập thông tin nhận hàng, tạo đơn, xử lý lỗi, thanh toán, hủy đơn và điều hướng kết quả.

Các kiểm tra tồn kho, hoàn kho và công nợ trong bộ E2E frontend xác nhận dữ liệu và endpoint được gửi đúng tới backend. Tính toàn vẹn giao dịch trong cơ sở dữ liệu cần được xác minh thêm bằng integration test phía backend.
