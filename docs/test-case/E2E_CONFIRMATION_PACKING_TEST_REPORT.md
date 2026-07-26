# Báo cáo kiểm thử quy trình xác nhận và đóng hàng

**Dự án:** Quản Lý Vựa Cá  
**Ngày kiểm thử:** 21/07/2026  
**Công cụ:** Playwright  
**Trình duyệt:** Chrome  
**Tổng số test case:** 40  
**Kết quả:** 40 đạt, 0 không đạt

## Bảng kết quả kiểm thử

| STT | Nội dung kiểm tra | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---:|---|---|---|:---:|
| 1 | Hiển thị đơn chờ xác nhận | Đầy đủ khách hàng, sản phẩm và trạng thái | Thông tin hiển thị đầy đủ | Đạt |
| 2 | Thao tác của đơn chờ xác nhận | Có nút bắt đầu đóng hàng và hủy đơn | Hai thao tác hiển thị đúng | Đạt |
| 3 | Bắt đầu đóng hàng | Yêu cầu người dùng xác nhận | Hộp thoại xác nhận hiển thị đúng | Đạt |
| 4 | Đóng hộp thoại xác nhận | Không đổi trạng thái | Không gửi request, trạng thái được giữ nguyên | Đạt |
| 5 | Đồng ý xác nhận đơn | Gửi trạng thái `DANG_DONG_HANG` | Payload trạng thái chính xác | Đạt |
| 6 | Xác nhận thành công | Giao diện chuyển sang “Đang đóng hàng” | Trạng thái cập nhật đúng | Đạt |
| 7 | Thông báo xác nhận | Hiển thị thông báo thành công | Toast hiển thị đúng | Đạt |
| 8 | Làm mới chi tiết sau xác nhận | Tải lại dữ liệu sản phẩm | API chi tiết được gọi lại | Đạt |
| 9 | Nhấn xác nhận liên tục | Chỉ gửi một request | Một request được gửi | Đạt |
| 10 | Đơn đã xác nhận | Không còn nút bắt đầu đóng hàng | Nút không hiển thị | Đạt |
| 11 | Đơn đã hủy | Không cho xác nhận lại | Không có thao tác xác nhận | Đạt |
| 12 | Đơn đang vận chuyển | Không cho quay lại đóng hàng | Chỉ hiển thị thao tác trạng thái kế tiếp | Đạt |
| 13 | Kho không đủ | Hiển thị cảnh báo giao thiếu | Cảnh báo hiển thị đúng | Đạt |
| 14 | Backend điều chỉnh giao thiếu | Chi tiết và tiền được tải lại | Dữ liệu điều chỉnh hiển thị đúng | Đạt |
| 15 | Backend từ chối nghiệp vụ | Giữ trạng thái và hiển thị lỗi | Xử lý đúng | Đạt |
| 16 | Người dùng không đủ quyền | Không xác nhận đơn | Lỗi 403 hiển thị đúng | Đạt |
| 17 | Đơn không tồn tại | Hiển thị lỗi phù hợp | Lỗi 404 hiển thị đúng | Đạt |
| 18 | Trạng thái bị xung đột | Không ghi đè trạng thái mới | Lỗi 409 hiển thị đúng | Đạt |
| 19 | Lỗi máy chủ | Giữ nguyên đơn và hiển thị lỗi | Lỗi được xử lý đúng | Đạt |
| 20 | Hai nhân viên cùng xác nhận | Một thao tác bị từ chối do xung đột | Thông báo xung đột hiển thị đúng | Đạt |
| 21 | Customer truy cập trang quản trị | Bị chuyển hướng khỏi trang | Điều hướng về trang chủ | Đạt |
| 22 | Staff truy cập đơn chờ xác nhận | Được phép xem và thao tác | Nút xác nhận hiển thị | Đạt |
| 23 | Nhấn hủy đơn | Yêu cầu xác nhận trước khi hủy | Hộp thoại hiển thị đúng | Đạt |
| 24 | Đồng ý hủy đơn | Chuyển trạng thái sang `HUY` | Trạng thái “Đã hủy” hiển thị | Đạt |
| 25 | Đóng hộp thoại hủy | Không gửi request hủy | Đơn giữ trạng thái chờ xác nhận | Đạt |
| 26 | Chế độ cân và đóng hàng | Có ô cân nặng cho từng sản phẩm | Hiển thị đúng số ô nhập | Đạt |
| 27 | Nhập cân nặng thực tế | Giá trị từng sản phẩm được cập nhật | Dữ liệu nhập hiển thị đúng | Đạt |
| 28 | Thành tiền theo cân nặng | Tính lại ngay theo cân nặng × đơn giá | Thành tiền cập nhật chính xác | Đạt |
| 29 | Lưu cân nặng | Gửi đúng mã chi tiết và số kg | Payload lưu chính xác | Đạt |
| 30 | Làm mới sau khi lưu | Tải lại chi tiết từ backend | Dữ liệu được tải lại | Đạt |
| 31 | Thông báo lưu thành công | Hiển thị toast thành công | Toast hiển thị đúng | Đạt |
| 32 | Cân nặng âm | Không cho lưu | Hiển thị lỗi dữ liệu | Đạt |
| 33 | Cân nặng không phải số | Không cho lưu | Hiển thị lỗi dữ liệu | Đạt |
| 34 | Cân nặng bằng 0 | Không cho lưu | Hiển thị lỗi dữ liệu | Đạt |
| 35 | Tổng tiền toàn đơn | Bằng tổng thành tiền thực tế | Tổng tiền tính đúng | Đạt |
| 36 | Đơn giá sau khi sửa cân nặng | Đơn giá không thay đổi | Đơn giá được giữ nguyên | Đạt |
| 37 | API lưu cân nặng thất bại | Giữ dữ liệu đang nhập | Giá trị nhập không bị mất | Đạt |
| 38 | Thông báo lỗi lưu cân nặng | Hiển thị lỗi cho người dùng | Toast lỗi hiển thị đúng | Đạt |
| 39 | Chuyển trạng thái khi chưa lưu cân | Cảnh báo dữ liệu chưa lưu | Hộp thoại cảnh báo hiển thị | Đạt |
| 40 | Đơn ngoài trạng thái đóng hàng | Không cho chỉnh cân nặng | Không hiển thị ô nhập | Đạt |

## Tổng hợp kết quả

| Nhóm kiểm thử | Số lượng | Đạt | Không đạt |
|---|---:|---:|---:|
| Xác nhận và hủy đơn | 25 | 25 | 0 |
| Cân nặng và thành tiền thực tế | 15 | 15 | 0 |
| **Tổng cộng** | **40** | **40** | **0** |

**Tỷ lệ đạt:** 100%

## Kết luận

Quy trình xác nhận và đóng hàng đáp ứng các nội dung đã kiểm tra trên Chrome, từ đơn chờ xác nhận, chuyển sang đóng hàng, xử lý hủy/xung đột/quyền truy cập đến cập nhật cân nặng và tính lại thành tiền thực tế.

Các test E2E xác nhận đúng giao diện và hợp đồng API. Việc khóa đồng thời, trừ kho và tính toàn vẹn giao dịch trong cơ sở dữ liệu cần tiếp tục được bảo vệ bằng integration test phía backend.
