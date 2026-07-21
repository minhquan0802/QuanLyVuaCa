# Báo cáo kiểm thử chức năng công nợ

**Dự án:** Quản Lý Vựa Cá  
**Ngày kiểm thử:** 21/07/2026  
**Phạm vi giao diện:** Quản lý công nợ  
**Công cụ:** Playwright  
**Trình duyệt:** Chrome  
**Tổng số test case giao diện:** 46  
**Kết quả:** 43 đạt, 3 không đạt

## Bảng kết quả kiểm thử

| STT | Nội dung kiểm tra | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---:|---|---|---|:---:|
| 1 | Hiển thị thông tin khách hàng có công nợ | Tên, liên hệ, hạn mức và dư nợ hiển thị đúng định dạng Việt Nam | Thông tin đúng nhưng tiền dùng dấu phẩy phân cách hàng nghìn | Không đạt |
| 2 | Danh sách chưa có khách hàng mở công nợ | Hiển thị thông báo danh sách trống | Thông báo hiển thị đúng | Đạt |
| 3 | Không tải được danh sách công nợ | Hiển thị thông báo lỗi | Thông báo lỗi hiển thị đúng | Đạt |
| 4 | Khách hàng có số dư trả trước | Hiển thị số tiền trả trước theo định dạng Việt Nam | Nội dung đúng nhưng tiền dùng dấu phẩy phân cách hàng nghìn | Không đạt |
| 5 | Khách hàng chưa có số điện thoại | Hiển thị dấu gạch ngang | Hiển thị đúng | Đạt |
| 6 | Khách hàng chưa được cấp hạn mức | Hiển thị trạng thái “Chưa cấp hạn mức” | Hiển thị đúng | Đạt |
| 7 | Công nợ dưới 80% hạn mức | Hiển thị trạng thái “Bình thường” | Hiển thị đúng | Đạt |
| 8 | Công nợ bằng 80% hạn mức | Hiển thị trạng thái “Cảnh báo” | Hiển thị đúng | Đạt |
| 9 | Công nợ bằng hạn mức | Hiển thị trạng thái “Nguy hiểm” | Hiển thị đúng | Đạt |
| 10 | Khách hàng đang bị khóa | Ưu tiên hiển thị trạng thái “Bị khóa” | Hiển thị đúng | Đạt |
| 11 | Tìm kiếm theo tên | Trả về đúng khách hàng, không phân biệt hoa thường | Kết quả đúng | Đạt |
| 12 | Tìm kiếm theo email | Trả về đúng khách hàng | Kết quả đúng | Đạt |
| 13 | Tìm kiếm theo số điện thoại | Trả về đúng khách hàng | Kết quả đúng | Đạt |
| 14 | Tìm kiếm không có kết quả | Hiển thị trạng thái danh sách trống | Hiển thị đúng | Đạt |
| 15 | Phân trang danh sách | Mỗi trang tối đa 10 khách hàng và chuyển trang đúng | Hoạt động đúng | Đạt |
| 16 | Quyền của quản trị viên | Được cấp hạn mức, điều chỉnh và mở khóa | Các thao tác hiển thị đúng | Đạt |
| 17 | Quyền của nhân viên | Chỉ được xem danh sách và lịch sử | Các thao tác quản trị được ẩn | Đạt |
| 18 | Customer truy cập trang công nợ | Bị chuyển khỏi trang quản trị | Được chuyển về trang chủ | Đạt |
| 19 | Mở biểu mẫu cấp công nợ | Hiển thị trường khách hàng và hạn mức | Biểu mẫu hiển thị đúng | Đạt |
| 20 | Danh sách khách hàng cấp công nợ mới | Chỉ có Customer chưa được cấp hạn mức | Danh sách được lọc đúng | Đạt |
| 21 | Cấp hạn mức khi chưa chọn khách hàng | Không gửi yêu cầu và hiển thị lỗi | Xử lý đúng | Đạt |
| 22 | Hạn mức bằng 0 | Không cho lưu | Hiển thị lỗi phù hợp | Đạt |
| 23 | Hạn mức âm | Không cho lưu | Hiển thị lỗi phù hợp | Đạt |
| 24 | Cấp hạn mức hợp lệ | Gửi đúng khách hàng và số tiền | Dữ liệu gửi chính xác | Đạt |
| 25 | Mở biểu mẫu sửa hạn mức | Hiển thị hạn mức hiện tại | Giá trị hiển thị đúng | Đạt |
| 26 | Cập nhật hạn mức | Gửi đúng hạn mức mới | Dữ liệu gửi chính xác | Đạt |
| 27 | Cập nhật hạn mức thành công | Tải lại danh sách công nợ | Danh sách được tải lại | Đạt |
| 28 | Cập nhật hạn mức thất bại | Hiển thị lỗi và giữ dữ liệu đang nhập | Xử lý đúng | Đạt |
| 29 | Nhấn lưu hạn mức liên tục | Chỉ gửi một yêu cầu | Một yêu cầu được gửi | Đạt |
| 30 | Mở biểu mẫu điều chỉnh nợ | Hiển thị đúng khách hàng và loại điều chỉnh | Biểu mẫu hiển thị đúng | Đạt |
| 31 | Cộng công nợ | Gửi đúng số tiền, loại cộng và lý do | Dữ liệu gửi chính xác | Đạt |
| 32 | Trừ công nợ | Gửi đúng số tiền, loại trừ và lý do | Dữ liệu gửi chính xác | Đạt |
| 33 | Điều chỉnh số tiền bằng 0 | Không cho thực hiện | Hiển thị lỗi phù hợp | Đạt |
| 34 | Điều chỉnh không có lý do | Không cho thực hiện | Hiển thị lỗi phù hợp | Đạt |
| 35 | Lý do điều chỉnh có khoảng trắng thừa | Loại bỏ khoảng trắng trước khi gửi | Dữ liệu được chuẩn hóa đúng | Đạt |
| 36 | API điều chỉnh thất bại | Hiển thị lỗi và giữ dữ liệu đang nhập | Xử lý đúng | Đạt |
| 37 | Điều kiện hiển thị mở khóa | Chỉ khách hàng bị khóa có thao tác mở khóa | Hiển thị đúng | Đạt |
| 38 | Mở khóa không có lý do | Không cho thực hiện | Hiển thị lỗi phù hợp | Đạt |
| 39 | Mở khóa hợp lệ | Gửi đúng lý do và thông báo thành công | Xử lý đúng | Đạt |
| 40 | API mở khóa thất bại | Hiển thị lỗi và giữ dữ liệu đang nhập | Xử lý đúng | Đạt |
| 41 | Nội dung lịch sử công nợ | Hiển thị đầy đủ cột, số tiền đúng định dạng Việt Nam | Dữ liệu đúng nhưng tiền dùng dấu phẩy phân cách hàng nghìn | Không đạt |
| 42 | Loại biến động công nợ | Hiển thị “Tăng nợ”, “Giảm nợ”, “Điều chỉnh” | Hiển thị đúng | Đạt |
| 43 | Lịch sử thiếu người thực hiện hoặc ghi chú | Hiển thị “Hệ thống” hoặc dấu gạch ngang | Hiển thị đúng | Đạt |
| 44 | Lịch sử chưa có biến động | Hiển thị thông báo lịch sử trống | Hiển thị đúng | Đạt |
| 45 | Không tải được lịch sử | Hiển thị thông báo lỗi | Thông báo lỗi hiển thị đúng | Đạt |
| 46 | Đóng cửa sổ lịch sử | Cửa sổ được đóng | Hoạt động đúng | Đạt |

## Tổng hợp kết quả giao diện

| Nhóm kiểm thử | Số lượng | Đạt | Không đạt |
|---|---:|---:|---:|
| Danh sách, trạng thái và phân quyền | 18 | 16 | 2 |
| Hạn mức tín dụng | 11 | 11 | 0 |
| Điều chỉnh và mở khóa | 11 | 11 | 0 |
| Lịch sử biến động | 6 | 5 | 1 |
| **Tổng cộng** | **46** | **43** | **3** |

**Tỷ lệ đạt:** 93,48%

## Kiểm tra nghiệp vụ backend hỗ trợ công nợ

Đã chạy 36 kiểm tra backend của dịch vụ công nợ và đơn hàng liên quan. Kết quả: **36 đạt, 0 không đạt**.

Các nội dung chính được xác nhận gồm:

- Thanh toán một phần, thanh toán hết nợ và số dư trả trước.
- Tính tổng nợ dự kiến từ công nợ hiện tại, đơn đang xử lý và giỏ hàng mới.
- Chặn đặt hàng khi vượt hạn mức hoặc tài khoản bị khóa.
- Không tính đơn đã hủy hoặc đơn đã giao hai lần vào nợ dự kiến.
- Phát sinh công nợ khi giao hàng thành công và không ghi nhận trùng.
- Cấp hạn mức lần đầu, tính công nợ lịch sử và thay đổi hạn mức giữa kỳ.
- Điều chỉnh tăng, giảm, mở khóa và lưu người thực hiện, lý do.
- Đối chiếu dư nợ hiện tại với số dư cuối cùng trong lịch sử công nợ.

## Vấn đề phát hiện

Ba test case không đạt có cùng nguyên nhân: giao diện gọi `toLocaleString()` nhưng không chỉ định locale `vi-VN`. Vì vậy dấu phân cách hàng nghìn phụ thuộc vào môi trường Chrome và đang hiển thị theo dạng `10,000,000đ` thay vì `10.000.000đ`.

Mã chức năng chưa được thay đổi trong lần kiểm thử này. Vấn đề cần được sửa riêng, sau đó chạy lại ba test case không đạt.

## Kết luận

Các quy tắc nghiệp vụ công nợ phía backend đáp ứng toàn bộ nội dung đã chạy. Giao diện quản lý công nợ hoạt động đúng ở các thao tác chính, nhưng chưa đáp ứng yêu cầu định dạng tiền Việt Nam một cách ổn định trên Chrome.
