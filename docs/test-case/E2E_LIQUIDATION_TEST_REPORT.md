# Báo cáo kiểm thử chức năng lập phiếu thanh lý

**Dự án:** Quản Lý Vựa Cá  
**Ngày kiểm thử:** 21/07/2026  
**Phạm vi:** Lập phiếu nhiều lô, thanh lý một lô và xử lý tồn kho backend  
**Trình duyệt E2E:** Chrome  
**Tổng số test case:** 80  
**Kết quả:** 70 đạt, 10 không đạt  
**Tỷ lệ đạt:** 87,50%

## Bảng kết quả kiểm thử

| STT | Nội dung kiểm tra | Kết quả thực tế | Trạng thái |
|---:|---|---|:---:|
| 1 | Admin truy cập trang lập phiếu | Trang hiển thị đúng | Đạt |
| 2 | Ngăn Staff mở trang lập phiếu | Staff vẫn mở được URL lập phiếu | Không đạt |
| 3 | Ngăn Customer truy cập trang quản trị | Customer được chuyển về trang chủ | Đạt |
| 4 | Trạng thái tải danh sách sản phẩm | Hiển thị và kết thúc đúng | Đạt |
| 5 | Tải sản phẩm trong kho | Dữ liệu hiển thị đúng | Đạt |
| 6 | Lỗi tải sản phẩm | Thông báo lỗi hiển thị đúng | Đạt |
| 7 | Kho không có sản phẩm | Danh sách rỗng được xử lý đúng | Đạt |
| 8 | Loại cá không trùng lặp | Mỗi loại chỉ hiển thị một lần | Đạt |
| 9 | Khóa trường Size trước khi chọn cá | Trường Size bị vô hiệu hóa | Đạt |
| 10 | Lọc Size theo loại cá | Chỉ hiển thị Size phù hợp | Đạt |
| 11 | Đổi loại cá | Size và lô cũ được xóa | Đạt |
| 12 | Chưa chọn đủ sản phẩm | Chưa cho chọn lô | Đạt |
| 13 | Tải lô theo mã sản phẩm | API nhận đúng mã sản phẩm | Đạt |
| 14 | Danh sách lô còn hàng | Hiển thị đúng dữ liệu API | Đạt |
| 15 | Thứ tự lô theo ngày nhập | Lô cũ hiển thị trước | Đạt |
| 16 | Thông tin lô | Ngày nhập và tồn lô hiển thị đúng | Đạt |
| 17 | Sản phẩm không còn lô | Hiển thị thông báo phù hợp | Đạt |
| 18 | Lỗi tải danh sách lô | Thông báo lỗi hiển thị đúng | Đạt |
| 19 | Đổi Size | Lô đã chọn được xóa | Đạt |
| 20 | Thêm khi chưa chọn sản phẩm | Hệ thống từ chối | Đạt |
| 21 | Thêm khi chưa chọn lô | Hệ thống từ chối | Đạt |
| 22 | Số lượng để trống | Hệ thống từ chối | Đạt |
| 23 | Số lượng bằng 0 | Hệ thống từ chối | Đạt |
| 24 | Số lượng âm | Hệ thống từ chối | Đạt |
| 25 | Số lượng thập phân | Dòng chi tiết được thêm đúng | Đạt |
| 26 | Số lượng bằng tồn lô | Dòng chi tiết được thêm | Đạt |
| 27 | Số lượng vượt tồn lô | Hệ thống từ chối và báo tồn còn lại | Đạt |
| 28 | Đơn giá âm | Hệ thống từ chối | Đạt |
| 29 | Đơn giá 0 khi tiêu hủy | Dòng chi tiết được thêm | Đạt |
| 30 | Bán thanh lý với đơn giá 0 | Hệ thống vẫn cho thêm dòng | Không đạt |
| 31 | Tiêu hủy với đơn giá lớn hơn 0 | Hệ thống vẫn cho thêm dòng | Không đạt |
| 32 | Thêm dòng hợp lệ | Dòng xuất hiện trong bảng | Đạt |
| 33 | Nội dung dòng chi tiết | Sản phẩm, lô, số lượng và giá đúng | Đạt |
| 34 | Đặt lại biểu mẫu sau khi thêm | Lô, số lượng và giá được đặt lại | Đạt |
| 35 | Thêm nhiều lô | Nhiều dòng được lưu trên phiếu | Đạt |
| 36 | Thêm cùng lô trong giới hạn | Các dòng được thêm | Đạt |
| 37 | Tổng nhiều dòng cùng lô vượt tồn | Giao diện vẫn cho thêm vượt tồn | Không đạt |
| 38 | Thành tiền từng dòng | Bằng số lượng nhân đơn giá | Đạt |
| 39 | Tổng số lượng phiếu | Bằng tổng số kg các dòng | Đạt |
| 40 | Tổng tiền phiếu | Bằng tổng thành tiền các dòng | Đạt |
| 41 | Tổng tiền phiếu tiêu hủy | Hiển thị bằng 0 | Đạt |
| 42 | Tổng tiền sau khi thêm | Cập nhật đúng | Đạt |
| 43 | Tổng tiền sau khi xóa | Cập nhật đúng | Đạt |
| 44 | Xóa dòng được chọn | Đúng dòng bị loại khỏi bảng | Đạt |
| 45 | Định dạng tiền Việt Nam | Chrome hiển thị dấu phẩy thay vì dấu chấm | Không đạt |
| 46 | Hoàn tất khi thiếu lý do | Hệ thống từ chối | Đạt |
| 47 | Lý do chỉ có khoảng trắng | Hệ thống từ chối | Đạt |
| 48 | Hoàn tất khi chưa có chi tiết | Nút hoàn tất bị vô hiệu hóa | Đạt |
| 49 | Ghi chú để trống | Phiếu vẫn được gửi | Đạt |
| 50 | Thông tin chung trong payload | Lý do, trạng thái và ghi chú đúng | Đạt |
| 51 | Chi tiết trong payload | Mã lô, số lượng và đơn giá đúng | Đạt |
| 52 | Trạng thái tiêu hủy | Gửi đúng `DA_TIEU_HUY` | Đạt |
| 53 | Trạng thái bán thanh lý | Gửi đúng `DA_BAN_THANH_LY` | Đạt |
| 54 | Thông báo lập phiếu thành công | Thông báo hiển thị đúng | Đạt |
| 55 | Điều hướng sau khi thành công | Trở về danh sách thanh lý | Đạt |
| 56 | API lập phiếu thất bại | Hiển thị lỗi và giữ dữ liệu | Đạt |
| 57 | Nhấn hoàn tất liên tục | Chỉ ghi nhận một yêu cầu trong kiểm thử | Đạt |
| 58 | Hủy lập phiếu | Trở về danh sách, không tạo phiếu | Đạt |
| 59 | Tải lô theo URL | Hiển thị đúng lô | Đạt |
| 60 | Lô không tồn tại hoặc đã hết | Hiển thị thông báo phù hợp | Đạt |
| 61 | Thanh lý toàn bộ lô | Tự điền toàn bộ số lượng tồn | Đạt |
| 62 | Thanh lý một phần | Cho phép nhập số lượng | Đạt |
| 63 | Chuyển lại toàn bộ lô | Khôi phục số lượng tồn | Đạt |
| 64 | Thanh lý một phần vượt tồn | Hệ thống từ chối | Đạt |
| 65 | Thành tiền của một lô | Tính đúng số lượng nhân đơn giá | Đạt |
| 66 | Gửi trùng thanh lý một lô | Chỉ gửi một yêu cầu | Đạt |
| 67 | Người tạo và thời gian lập phiếu | Ghi nhận đúng tài khoản và thời gian | Đạt |
| 68 | Lô không tồn tại | Không lưu chi tiết và phát sinh lỗi | Đạt |
| 69 | Trừ số lượng tồn lô | Số lượng còn lại được cập nhật đúng | Đạt |
| 70 | Thanh lý hết lô | Lô chuyển sang trạng thái `THANH_LY` | Đạt |
| 71 | Thanh lý một phần | Lô giữ trạng thái còn hàng | Đạt |
| 72 | Trừ tồn kho tổng | Tồn kho sản phẩm giảm đúng | Đạt |
| 73 | Bảo vệ tồn kho tổng không âm | Tồn kho được giữ ở mức 0 | Đạt |
| 74 | Thành tiền chi tiết backend | Giá trị được lưu chính xác | Đạt |
| 75 | Giao dịch phiếu nhiều lô | Phương thức có giao dịch và phát sinh lỗi khi một dòng sai | Đạt |
| 76 | Khóa lô khi xử lý đồng thời | Repository chưa sử dụng khóa ghi | Không đạt |
| 77 | Backend từ chối danh sách chi tiết rỗng | Service vẫn tạo phần đầu phiếu | Không đạt |
| 78 | Backend từ chối số lượng bằng 0 hoặc âm | Service không từ chối hai trường hợp | Không đạt |
| 79 | Backend từ chối đơn giá âm | Service vẫn xử lý đơn giá âm | Không đạt |
| 80 | Backend từ chối trạng thái không hợp lệ | Trạng thái sai tự chuyển thành tiêu hủy | Không đạt |

## Tổng hợp kết quả

| Nhóm kiểm thử | Số lượng | Đạt | Không đạt |
|---|---:|---:|---:|
| Quyền truy cập và tải dữ liệu | 7 | 6 | 1 |
| Chọn sản phẩm và lô hàng | 12 | 12 | 0 |
| Thêm và quản lý chi tiết | 26 | 22 | 4 |
| Hoàn tất phiếu | 13 | 13 | 0 |
| Thanh lý trực tiếp một lô | 8 | 8 | 0 |
| Nghiệp vụ backend | 14 | 9 | 5 |
| **Tổng cộng** | **80** | **70** | **10** |

## Các vấn đề cần xử lý

1. Staff vẫn có thể mở trực tiếp trang lập phiếu mặc dù API tạo phiếu chỉ cho Admin.
2. Chưa ràng buộc đơn giá với trạng thái tiêu hủy hoặc bán thanh lý.
3. Giao diện chưa cộng dồn số lượng khi cùng một lô được thêm nhiều dòng.
4. Tiền chưa được định dạng cố định theo locale `vi-VN`.
5. Backend chưa khóa bản ghi lô để phòng tránh hai yêu cầu đồng thời.
6. Backend chưa kiểm tra danh sách chi tiết rỗng, số lượng không dương và đơn giá âm tại tầng service/controller.
7. Trạng thái không hợp lệ đang bị tự động đổi thành “Đã tiêu hủy” thay vì bị từ chối.

## Kết luận

Luồng lập phiếu và tính toán cơ bản hoạt động đúng. Chức năng chưa đạt yêu cầu về phân quyền giao diện, ràng buộc trạng thái–đơn giá, cộng dồn tồn lô và bảo vệ dữ liệu backend. Các test case không đạt được giữ nguyên để làm tiêu chí xác nhận sau khi sửa chức năng.
