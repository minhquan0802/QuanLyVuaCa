# Đặc tả phần mềm POS Vựa Cá

| | |
|---|---|
| Phiên bản | 1.2 |
| Ngày | 09/09/2026 |
| Nhánh | `POS` |
| Trạng thái | Bản thảo — chờ duyệt trước khi lập trình |
| Tài liệu liên quan | [`KIEN-TRUC.md`](./KIEN-TRUC.md) · [`VIETQR.md`](./VIETQR.md) · `schema-server.sql` · `schema-client.sql` |

**Thay đổi so với v1.1**

- Chốt: chỉ **một máy quầy**, nhân viên đóng hàng **dùng chung máy đó** → bỏ máy chủ HTTP nhúng, bỏ thiết kế LAN.
- Thêm **web trên Host** để xem bảng đóng hàng và thống kê từ xa (§5.10).
- Bảng đóng hàng gộp thành **một bảng duy nhất** hiển thị toàn bộ đơn đang cần đóng (§5.5).
- Khôi phục **đơn vị tính và hệ số quy đổi kg** đúng như project cũ (§5.3).
- Thêm thao tác **thêm/sửa nhóm giá** (§5.2).
- Trả tiền từng phần: hoãn lại, không làm lần này.

---

## 1. Mục tiêu

Bốn việc, theo đúng thứ tự ưu tiên:

1. **Đặt hàng** tại quầy, lưu đơn và thông tin khách.
2. **Hiển thị đơn hàng** — trong đó quan trọng nhất là bảng toàn bộ đơn đang cần đóng.
3. **Sửa đơn hàng**.
4. **Thống kê** cuối ngày.

Ngoài ra, đẩy dữ liệu lên Host để xem bảng đóng hàng và thống kê qua trình duyệt từ xa.

## 2. Phạm vi

### 2.1 Trong phạm vi

| Mã | Hạng mục |
|---|---|
| PV-01 | Quản lý khách hàng: tên, số điện thoại, địa chỉ, nhóm giá |
| PV-02 | Đặt hàng tại quầy, chọn khách có sẵn hoặc khách vãng lai |
| PV-03 | **Nhiều bậc giá**, thêm/sửa nhóm giá ngay trong phần mềm |
| PV-04 | **Đơn vị tính có hệ số quy đổi kg**, số kg tự tính khi đặt hàng |
| PV-05 | Nhập giá thủ công cho từng dòng hàng |
| PV-06 | Danh sách đơn hàng, tìm kiếm, xem chi tiết, in lại phiếu |
| PV-07 | **Sửa đơn ở bất kỳ trạng thái nào**, có lưu vết đầy đủ |
| PV-08 | Thanh toán khách lẻ: tiền mặt hoặc VietQR, đổi được tài khoản nhận |
| PV-09 | **Một bảng duy nhất hiển thị toàn bộ đơn đang cần đóng** |
| PV-10 | **Thống kê cuối ngày**: tổng doanh thu + chi tiết từng đơn |
| PV-11 | **Web trên Host**: xem bảng đóng hàng và thống kê từ xa |
| PV-12 | Hoạt động được khi mất kết nối Internet |

### 2.2 Ngoài phạm vi

| Hạng mục | Ghi chú |
|---|---|
| **Công nợ khách sỉ** | Đơn chỉ có cờ *đã trả / chưa trả*. |
| **Trả tiền từng phần** | Hoãn theo quyết định ở §11. Hiện chỉ *đã trả / chưa trả*. |
| **Tự động đối soát tiền chuyển khoản** | Nhân viên tự xác nhận. Xem [`VIETQR.md`](./VIETQR.md) §6. |
| **Đặt hàng bằng điện thoại** | Hướng phát triển sau. Lược đồ đã chừa chỗ, xem §7.4. |
| Tồn kho, nhập hàng, nhà cung cấp | Không theo dõi tồn. |
| Ca bán, chốt ca, kiểm tiền mặt | |
| Cân điện tử, ngăn kéo tiền | Nhập số ký bằng tay. |
| VNPay, thẻ | |
| Nhiều máy quầy | Chốt: chỉ một máy. |

## 3. Thuật ngữ

| Từ | Nghĩa |
|---|---|
| **Máy quầy** | Máy tính duy nhất đặt tại quầy. Vừa bán hàng vừa hiển thị bảng đóng hàng. |
| **Host** | Máy chủ trên Internet, chạy API và trang web xem từ xa. |
| **Đơn hàng** | Một lần khách đặt hàng. Mã dạng `POS-20260909-0007`. |
| **Nhóm giá** | Một bậc giá. Mặc định `LE`, `SI_GAN`, `SI_XA`, `SI_VIP`. Thêm/sửa được. |
| **Khách sỉ** | Khách thuộc nhóm giá có cờ `la_si`. Đơn **luôn** đi qua bước đóng hàng. |
| **Đơn vị tính** | Cách khách gọi hàng: kg, con, thùng… Mỗi đơn vị có **hệ số quy đổi kg**. |
| **Số kg dự kiến** | `số lượng × hệ số quy đổi`. Tự tính khi đặt hàng. |
| **Số kg cân lại** | Số ký thật khi đóng hàng. Bỏ trống thì dùng số kg dự kiến. |

## 4. Tác nhân

| Tác nhân | Làm gì | Ở đâu |
|---|---|---|
| **Nhân viên quầy** | Nhận khách, đặt hàng, thu tiền, in phiếu | Máy quầy |
| **Nhân viên đóng hàng** | Xem bảng đóng hàng, tick từng dòng | **Cùng máy quầy**, cửa sổ thứ hai |
| **Chủ vựa** | Cập nhật giá, sửa đơn, xem thống kê | Máy quầy, hoặc **web trên Host từ xa** |

---

## 5. Yêu cầu chức năng

### 5.1 Khách hàng

| Mã | Yêu cầu |
|---|---|
| FR-KH-01 | Thêm, sửa, tìm khách theo tên hoặc số điện thoại. |
| FR-KH-02 | Mỗi khách bắt buộc thuộc **một nhóm giá**. |
| FR-KH-03 | Số điện thoại duy nhất trong số khách chưa xoá. Trùng thì gợi ý mở hồ sơ đã có. |
| FR-KH-04 | Xoá khách là **xoá mềm**. Đơn cũ giữ nguyên thông tin đã chụp lại. |
| FR-KH-05 | Tìm kiếm từ 2 ký tự, không phân biệt hoa thường và **dấu tiếng Việt** (gõ `hung` ra `Hưng`). |
| FR-KH-06 | Đổi nhóm giá của khách **không** làm đổi giá các đơn đã tạo. |

### 5.2 Nhóm giá và bảng giá

| Mã | Yêu cầu |
|---|---|
| FR-NG-01 | Danh mục **nhóm giá** sửa được ngay trong phần mềm. Mặc định: `LE` (Lẻ), `SI_GAN` (Sỉ ở gần), `SI_XA` (Sỉ ở xa), `SI_VIP` (Sỉ thân thiết). |
| FR-NG-02 | **Thêm nhóm giá mới**: nhập mã, tên, cờ `la_si`, thứ tự hiển thị. Không phải sửa mã nguồn. |
| FR-NG-03 | **Sửa nhóm giá**: đổi tên, thứ tự, cờ `la_si`. Đổi tên **không** làm đổi tên đã chụp trên đơn cũ. |
| FR-NG-04 | **Xoá nhóm giá** là xoá mềm, và **chặn** nếu còn khách hàng đang thuộc nhóm đó. Phải chuyển khách sang nhóm khác trước. |
| FR-NG-05 | Cờ **`la_si`** quyết định đơn có phải qua bước đóng hàng hay không. |
| FR-NG-06 | Đúng một nhóm giá được đánh dấu mặc định, dùng cho khách vãng lai. Không xoá được nhóm mặc định. |
| FR-NG-07 | Thêm nhóm giá mới thì **mọi sản phẩm đều chưa có giá** cho nhóm đó. Màn hình nhập giá phải hiện rõ các ô còn trống. |

| Mã | Yêu cầu |
|---|---|
| FR-DM-01 | Quản lý loại cá (tên, ảnh) và size cá (tên, thứ tự hiển thị). |
| FR-DM-02 | Sản phẩm là cặp *loại cá × size*, không trùng cặp. |
| FR-DM-03 | Quản lý **đơn vị tính**: tên và **hệ số quy đổi kg** (kg = 1, thùng = 25, con = 0,8…). |
| FR-DM-04 | Bảng giá lưu theo bộ ba **(sản phẩm, nhóm giá, khoảng ngày hiệu lực)**. Đơn giá là **giá mỗi kg**. |
| FR-DM-05 | Không cho hai bảng giá của cùng *(sản phẩm, nhóm giá)* chồng lấn khoảng ngày. **CSDL tự chặn**. |
| FR-DM-06 | Đổi giá không làm đổi giá các đơn đã tạo. |
| FR-DM-07 | **Màn hình nhập giá hàng loạt**: bảng *sản phẩm × nhóm giá*, sửa toàn bộ giá của ngày trong một lần lưu. Giá cá đổi gần như hằng ngày nên thao tác này phải nhanh. |
| FR-DM-08 | Nút **"Chép giá hôm qua"** điền sẵn toàn bộ bảng bằng giá ngày gần nhất. |
| FR-DM-09 | Sản phẩm chưa có giá cho nhóm giá đang chọn phải hiện rõ là *chưa có giá*, và **không thêm được vào đơn** trừ khi nhập giá thủ công. |

### 5.3 Đặt hàng

Cách nhập một dòng hàng giữ **đúng như project cũ** (`client/src/pages/admin/TaoDonHang.jsx`):

```
Chọn loại cá  ->  Chọn size  ->  Chọn đơn vị tính  ->  Nhập số lượng
                                        │                    │
                                        └── hệ số quy đổi ────┤
                                                              ▼
                                      Số kg dự kiến = số lượng × hệ số   (tự tính)
                                                              │
                                      Thành tiền = số kg × đơn giá mỗi kg
```

| Mã | Yêu cầu |
|---|---|
| FR-DH-01 | Tạo đơn mới, chọn khách có sẵn hoặc *khách vãng lai*. |
| FR-DH-02 | Chọn khách thì **tự áp nhóm giá của khách**, hiển thị rõ đang áp bậc giá nào. |
| FR-DH-03 | **Đổi nhóm giá thủ công** được cho từng đơn. Ghi lại người đổi và thời điểm. |
| FR-DH-04 | Khách vãng lai luôn dùng nhóm giá mặc định. Muốn giá sỉ phải tạo hồ sơ khách trước. |
| FR-DH-05 | Thêm dòng hàng: chọn sản phẩm, chọn **đơn vị tính**, nhập **số lượng**. |
| FR-DH-06 | **Số kg dự kiến tự tính** bằng `số lượng × hệ số quy đổi` của đơn vị tính đã chọn. |
| FR-DH-07 | Nếu đơn vị tính có **hệ số > 0** thì ô số kg **bị khoá**, không sửa tay được. Nếu hệ số bằng 0 thì mở ô cho nhập tay. Giữ đúng hành vi project cũ. |
| FR-DH-08 | Đơn giá là **giá mỗi kg**. Thành tiền dòng = `số kg × đơn giá`. |
| FR-DH-09 | **Nhập giá thủ công** được cho từng dòng. Dòng bị sửa giá đánh dấu rõ trên màn hình và trên phiếu. |
| FR-DH-10 | Thêm cùng một *(sản phẩm, đơn vị tính)* hai lần thì **cộng dồn vào dòng cũ**, không tạo dòng mới. Giữ đúng hành vi project cũ. |
| FR-DH-11 | Đơn phải có ít nhất một dòng mới được xác nhận. |
| FR-DH-12 | Khi xác nhận, đơn **chụp lại**: tên khách, số điện thoại, tên nhóm giá, tên sản phẩm, tên đơn vị tính, **hệ số quy đổi**, và đơn giá. |
| FR-DH-13 | Mã đơn `POS-<yyyyMMdd>-<số thứ tự trong ngày>`. Sinh tại máy quầy, không hỏi Host. |
| FR-DH-14 | Huỷ đơn phải nhập lý do. Đơn đã huỷ vẫn lưu. |
| FR-DH-15 | Mỗi đơn có ô ghi chú tự do, hiển thị nổi bật trên bảng đóng hàng. |
| FR-DH-16 | Đơn lưu **ngày bán** là trường riêng do máy quầy ghi, không suy ra từ giờ tạo đơn. |

> **Vì sao chụp lại hệ số quy đổi:** nếu sau này sửa "thùng" từ 25 kg thành 30 kg, đơn cũ phải giữ nguyên 25. Không chụp thì in lại phiếu năm ngoái sẽ ra số kg khác với số đã giao.

### 5.4 Xem đơn hàng

| Mã | Yêu cầu |
|---|---|
| FR-XD-01 | Danh sách đơn mặc định hiện đơn trong ngày, mới nhất lên đầu. |
| FR-XD-02 | Lọc theo: khoảng ngày, nhóm giá, trạng thái đơn, trạng thái đóng hàng, đã trả / chưa trả. |
| FR-XD-03 | Tìm theo mã đơn, tên khách, số điện thoại. |
| FR-XD-04 | Chi tiết đơn: thông tin khách, dòng hàng, tổng tiền, lịch sử trạng thái, **lịch sử sửa đơn**. |
| FR-XD-05 | In lại phiếu của đơn bất kỳ. |

### 5.5 Bảng đóng hàng

Đây là màn hình nhân viên đóng hàng nhìn suốt ngày. Yêu cầu cốt lõi: **một bảng duy nhất, thấy hết mọi đơn đang cần đóng, không phải bấm vào từng đơn**.

| Mã | Yêu cầu |
|---|---|
| FR-DG-01 | Đơn thuộc nhóm giá có `la_si = true` khi xác nhận tự vào bảng đóng hàng với trạng thái `CHO_DONG`. |
| FR-DG-02 | Đơn nhóm `LE` mặc định `KHONG_CAN`. Bật thủ công được nếu khách lẻ mua nhiều. |
| FR-DG-03 | **Một bảng duy nhất** liệt kê toàn bộ đơn đang `CHO_DONG` hoặc `DANG_DONG`, kèm **tất cả dòng hàng** của từng đơn. Không phải bấm mở từng đơn. |
| FR-DG-04 | Các dòng của cùng một đơn **gộp thành một khối**: ô tên khách, giờ đặt và ghi chú gộp ô (rowspan), có đường kẻ đậm ngăn cách giữa các đơn. |
| FR-DG-04b | Bảng **không hiển thị mã đơn**. Nhân viên đóng hàng nhận biết đơn bằng **tên khách**. Mã đơn vẫn được trả về trong dữ liệu để làm khoá và để tra cứu, chỉ là không đưa lên bảng. |
| FR-DG-05 | Sắp xếp theo giờ đặt, đơn cũ nhất lên đầu. |
| FR-DG-06 | Chữ đủ lớn để nhìn từ xa khoảng 2 mét. Số kg là chữ to nhất bảng. |
| FR-DG-07 | Bảng **tự cập nhật** khi có đơn mới hoặc trạng thái đổi, không cần tải lại trang. |
| FR-DG-08 | Tick từng dòng khi đóng xong. Đơn có dòng đầu tiên được tick thì chuyển `DANG_DONG`. Tick đủ mọi dòng thì chuyển `DA_DONG` và **biến khỏi bảng**. |
| FR-DG-09 | Ghi lại thời điểm bắt đầu đóng và đóng xong của từng đơn. |
| FR-DG-10 | Bảng **không hiển thị giá tiền**. Chỉ cần biết đóng gì, bao nhiêu ký. |
| FR-DG-11 | Đơn chờ quá 30 phút được làm nổi bật, phân biệt bằng cả màu **và** chữ. |
| FR-DG-12 | Nhập **số kg cân lại** cho từng dòng ngay trên bảng. Bỏ trống thì tính theo số kg dự kiến. Nhập vào thì tổng tiền đơn tự tính lại và ghi một bản ghi sửa đơn. |
| FR-DG-13 | Có ô đếm ở đầu bảng: *"4 đơn đang chờ · 27 mặt hàng · 312,5 kg"*. |

#### Bố cục bảng

| Khách hàng | Loại cá | Size | ĐVT | SL | Kg dự kiến | Kg cân lại | Ghi chú | ☐ |
|---|---|---|---|---|---|---|---|---|
| **CHỊ HOA**<br>0912 345 678<br>*Sỉ ở xa*<br>08:42 · chờ 12 phút<br>⚑ giao trước 10h | Cá điêu hồng | Size 1 | Thùng | 5 | **125,000** | `____` | | ☐ |
| ↑ gộp ô | Cá điêu hồng | Size 2 | Kg | 30 | **30,000** | `____` | để riêng | ☐ |
| ↑ gộp ô | Cá lóc | Size 1 | Con | 20 | **16,000** | `____` | | ☐ |
| **ANH TUẤN**<br>0987 654 321<br>*Sỉ ở gần*<br>09:05 · chờ 4 phút | Cá điêu hồng | Size 1 | Thùng | 2 | **50,000** | `____` | | ☐ |

Tên khách là chữ to thứ hai sau số kg — đó là thứ nhân viên đóng hàng dùng để nhận ra đơn. Ghi chú của đơn nằm luôn trong ô khách hàng để không bị trôi mất khi đơn có nhiều dòng.

### 5.6 Thanh toán

Giữ nguyên luồng đã có ở `client/src/pages/admin/TaoDonHang.jsx`.

| Mã | Yêu cầu |
|---|---|
| FR-TT-01 | **Khách lẻ**: sau khi bấm tạo đơn, hiện màn hình chọn **Tiền mặt** hoặc **Quét QR**. |
| FR-TT-02 | Chọn *Quét QR* thì hiện mã QR kèm số tiền và nút **"Đã nhận tiền, hoàn tất"**. |
| FR-TT-03 | **Đơn chỉ được ghi nhận sau khi nhân viên xác nhận đã thật sự nhận tiền**, không phải lúc hiện QR. Ghi lại ai xác nhận và lúc nào. |
| FR-TT-04 | **Khách sỉ**: tạo đơn ngay, trạng thái `CHUA_TRA`, thu tiền sau. |
| FR-TT-05 | Mã QR phải **sinh được khi mất Internet**. Sinh cục bộ theo chuẩn EMVCo, xem [`VIETQR.md`](./VIETQR.md). |
| FR-TT-06 | Nội dung chuyển khoản của QR là **mã đơn**, không phải chuỗi cố định. |
| FR-TT-07 | Thông tin tài khoản nhận **sửa được ngay trong phần mềm**, không phải build lại ứng dụng. |
| FR-TT-08 | Đổi tài khoản nhận **không sửa đè** bản ghi cũ. Tạo bản ghi mới, đánh dấu bản cũ ngừng dùng. |
| FR-TT-09 | Cho phép **sinh sẵn và lưu ảnh QR tĩnh** (không kèm số tiền) để in dán tại quầy. |
| FR-TT-10 | Đơn lưu lại **chuỗi QR đã hiện** và **tài khoản đã nhận tiền**. |

### 5.7 Sửa đơn hàng

| Mã | Yêu cầu |
|---|---|
| FR-SD-01 | Đơn **sửa được ở bất kỳ trạng thái nào**, kể cả `DA_DONG` và `HOAN_TAT`. |
| FR-SD-02 | Sửa được: dòng hàng (thêm/bớt/đổi số lượng), đơn vị tính, số kg, đơn giá, nhóm giá của đơn, thông tin khách, ghi chú. |
| FR-SD-03 | **Mỗi lần sửa bắt buộc nhập lý do** và lưu bản chụp toàn bộ đơn *trước* và *sau*. |
| FR-SD-04 | Sửa đơn đã thu tiền làm đổi tổng tiền thì hiện rõ **"khách trả thiếu / trả thừa X đồng"**. |
| FR-SD-05 | Sửa một dòng của đơn đã `DA_DONG` thì dòng đó **quay lại chưa đóng**, đơn về `DANG_DONG` và **hiện lại trên bảng đóng hàng ngay**. |
| FR-SD-06 | Đơn đã đẩy lên Host mà sửa lại thì được **đưa lại vào hàng đợi đồng bộ** để gửi bản mới. |
| FR-SD-07 | Đơn đã huỷ không sửa được. Muốn sửa phải mở lại đơn. |
| FR-SD-08 | Chỉ vai trò `QUAN_TRI` được sửa đơn ở trạng thái `HOAN_TAT`. |
| FR-SD-09 | **Khách gọi thêm hàng khi đơn chưa hoàn tất thì sửa đơn cũ, không tạo đơn mới.** Đây là quy tắc nghiệp vụ bắt buộc, không phải gợi ý. |
| FR-SD-10 | Khi mở đơn mới cho một khách **đang có đơn chưa hoàn tất**, hệ thống phải cảnh báo và cho chọn: *"Thêm vào đơn đang chờ của khách này"* hoặc *"Vẫn tạo đơn riêng"*. Mặc định là thêm vào đơn cũ. |
| FR-SD-11 | Thêm hàng vào đơn đang ở trạng thái `DANG_DONG` hoặc `DA_DONG` thì dòng mới vào bảng đóng hàng với trạng thái chưa đóng, và đơn quay về `DANG_DONG`. |

### 5.8 Thống kê

| Mã | Yêu cầu |
|---|---|
| FR-TK-01 | Nút **Thống kê** cho ra bảng của ngày đang chọn, mặc định hôm nay. |
| FR-TK-02 | Phần tổng hợp: **tổng doanh thu**, số đơn, số đơn sỉ / lẻ, thu tiền mặt, thu chuyển khoản, số tiền **chưa thu**, tổng số kg đã bán. |
| FR-TK-03 | Phần chi tiết: bảng **từng đơn hàng** trong ngày — mã đơn, khách, nhóm giá, số mặt hàng, tổng kg, tổng tiền, hình thức thanh toán, trạng thái. |
| FR-TK-04 | Đơn đã huỷ **không** tính vào doanh thu, liệt kê riêng để đối chiếu. |
| FR-TK-05 | Bấm một dòng mở chi tiết đơn đó. |
| FR-TK-06 | Chọn được ngày bất kỳ trong quá khứ, và khoảng ngày. |
| FR-TK-07 | Xuất ra tệp CSV. |
| FR-TK-08 | Thống kê chạy được **khi mất mạng**, tính trên dữ liệu của chính máy quầy. |

### 5.9 Xác thực

| Mã | Yêu cầu |
|---|---|
| FR-XT-01 | Đăng nhập bằng tài khoản, hoặc mã PIN 6 số để mở khoá nhanh. |
| FR-XT-02 | Chỉ `QUAN_TRI` được: sửa bảng giá, sửa danh mục, thêm/sửa/xoá nhóm giá, đổi tài khoản QR, sửa đơn đã `HOAN_TAT`. |
| FR-XT-03 | Cửa sổ bảng đóng hàng **trên máy quầy** không cần đăng nhập lại — máy đã đăng nhập rồi. |

### 5.10 Web trên Host

| Mã | Yêu cầu |
|---|---|
| FR-HO-01 | Máy quầy **đẩy đơn hàng và số liệu thống kê lên Host** khi có Internet. |
| FR-HO-02 | Host có trang **`/dong-hang`**: đúng bảng đóng hàng của §5.5, xem từ xa. |
| FR-HO-03 | Host có trang **`/thong-ke`**: đúng bảng thống kê của §5.8, chọn được ngày. |
| FR-HO-04 | Hai trang trên Host **dùng chung mã nguồn giao diện** với máy quầy, chỉ khác nguồn dữ liệu. Sửa bảng một lần, cả hai nơi cùng đổi. |
| FR-HO-05 | Trang trên Host **bắt buộc đăng nhập**. Bảng đóng hàng chứa tên và số điện thoại khách — là dữ liệu cá nhân, không được để công khai. |
| FR-HO-06 | Trang trên Host là **chỉ đọc** ở bản này. Không tick đóng hàng, không sửa đơn từ xa. |
| FR-HO-07 | Trang trên Host hiển thị rõ **thời điểm đồng bộ gần nhất** (*"số liệu tính đến 09:47"*), để người xem biết mình đang nhìn dữ liệu cũ bao lâu. |
| FR-HO-08 | Máy quầy mất mạng thì Host giữ nguyên dữ liệu lần đồng bộ cuối, kèm cảnh báo *"máy quầy đang ngoại tuyến"*. |

---

## 6. Luồng nghiệp vụ

### 6.1 Khách sỉ đặt hàng

```
1. Nhân viên tìm khách theo số điện thoại
   -> Hệ thống hiện "Sỉ ở xa — đang áp bảng giá Sỉ ở xa"
2. Thêm dòng: cá điêu hồng / Size 1 / Thùng / 5
   -> Số kg dự kiến tự tính = 5 × 25 = 125,000 kg  (ô kg bị khoá)
   -> Thành tiền = 125 × đơn giá mỗi kg
3. Ghi chú nếu có ("giao trước 10h")
4. Bấm XÁC NHẬN ĐƠN
   -> DA_XAC_NHAN + CHO_DONG + CHUA_TRA
   -> In phiếu
   -> Đơn xuất hiện ngay trên BẢNG ĐÓNG HÀNG (cửa sổ thứ hai)
5. Nhân viên đóng hàng cân lại, nhập số kg thực nếu lệch, tick từng dòng
   -> Tick hết -> DA_DONG, đơn biến khỏi bảng
   -> Tổng tiền tự tính lại theo số kg cân lại
6. Thu tiền -> DA_TRA -> giao hàng -> HOAN_TAT
```

**Khách quay lại gọi thêm hàng** (rất hay xảy ra, ở bất kỳ bước nào từ 4 đến 6):

```
Nhân viên tìm khách -> hệ thống thấy khách đang có đơn chưa hoàn tất
   -> cảnh báo: "Chị Hoa đang có đơn chờ đóng lúc 08:42"
        ├── [Thêm vào đơn đang chờ]  ← mặc định
        │     -> thêm dòng vào đơn cũ, dòng mới hiện ngay trên bảng đóng hàng
        │     -> đơn quay về DANG_DONG nếu đã đóng xong trước đó
        └── [Vẫn tạo đơn riêng]      ← chỉ dùng khi khách cố ý tách lô giao
```

Sửa đơn cũ thay vì tạo đơn mới là **quy tắc bắt buộc** (FR-SD-09). Nhờ vậy bảng đóng hàng gần như không bao giờ có hai khối trùng tên khách — điều kiện để bỏ được cột mã đơn.

### 6.2 Khách lẻ mua tại quầy

```
1. Mở đơn mới, chọn "Khách vãng lai"  -> áp bảng giá Lẻ
2. Thêm dòng hàng, cân, nhập số lượng
3. Bấm XÁC NHẬN ĐƠN -> màn hình chọn thanh toán
   ├── [Tiền mặt] ────────────────> ghi nhận đơn
   └── [Quét QR] -> hiện QR kèm số tiền, nội dung là mã đơn
                    -> [Đã nhận tiền, hoàn tất] -> ghi nhận đơn
4. In phiếu -> khách lấy hàng ngay. KHÔNG vào bảng đóng hàng.
```

Đơn khách lẻ sinh ra đã là `DA_TRA`.

### 6.3 Ba trạng thái độc lập

```
Trạng thái đơn:
   NHAP ──xác nhận──> DA_XAC_NHAN ──giao xong──> HOAN_TAT
     │                     │
     └───────huỷ───────────┴──────> DA_HUY

Trạng thái đóng hàng:
   KHONG_CAN                                (đơn lẻ thông thường)
   CHO_DONG ──tick dòng đầu──> DANG_DONG ──tick hết──> DA_DONG
                                   ↑                       │
                                   └──── sửa lại đơn ──────┘   (FR-SD-05)

Trạng thái thanh toán:
   CHUA_TRA ──xác nhận đã nhận tiền──> DA_TRA
```

---

## 7. Kiến trúc

Chi tiết ở [`KIEN-TRUC.md`](./KIEN-TRUC.md).

### 7.1 Hình dạng hệ thống

```
        MÁY QUẦY (duy nhất, Tauri + SQLite)
        ├── Cửa sổ 1: bán hàng
        ├── Cửa sổ 2: BẢNG ĐÓNG HÀNG      ← nhân viên đóng hàng dùng chung máy
        └── Thống kê
                 │
                 │  đẩy đơn + thống kê lên, mỗi 15 giây khi có mạng
                 ▼
        HOST (VPS)
        ├── API (NestJS) + PostgreSQL
        └── Web chỉ đọc:  /dong-hang   bảng đóng hàng, xem từ xa
                          /thong-ke    thống kê
```

### 7.2 Vì sao bỏ máy chủ HTTP nhúng của v1.1

v1.1 thiết kế một máy chủ Axum nhúng trong ứng dụng để phục vụ bảng đóng hàng qua mạng LAN. **Không cần nữa**: nhân viên đóng hàng dùng chung đúng máy quầy, nên bảng đóng hàng chỉ là **cửa sổ thứ hai của chính ứng dụng POS**, đọc thẳng SQLite.

Bỏ được: máy chủ Axum, IP tĩnh, cấu hình Windows Firewall, và cả rủi ro để dữ liệu khách hàng chạy trần trong mạng LAN không cần đăng nhập.

### 7.3 Một giao diện, hai nguồn dữ liệu

Bảng đóng hàng và bảng thống kê **dùng chung một bộ component React**, chỉ khác lớp lấy dữ liệu:

| Chạy ở đâu | Nguồn dữ liệu | Có cần Internet |
|---|---|---|
| Cửa sổ thứ hai trên máy quầy | SQLite cục bộ | Không |
| Trang web trên Host | API của Host | Có |

Sửa bố cục bảng một lần, cả hai nơi cùng đổi.

### 7.4 Chừa chỗ cho đặt hàng bằng điện thoại

Hướng phát triển sau là khách đặt qua điện thoại rồi đồng bộ về máy POS. Bản này **không làm**, nhưng lược đồ đã chừa hai chỗ để sau này không phải sửa dữ liệu cũ:

- `don_hang.nguon` (`POS` / `WEB`) — biết đơn sinh ra từ đâu.
- Mã đơn có tiền tố theo nguồn (`POS-...` / `WEB-...`) và khoá chính là UUID sinh tại nơi tạo — nên đơn tạo trên Host và đơn tạo tại quầy không bao giờ đụng nhau, kể cả khi máy quầy đang ngoại tuyến.

Khi làm tính năng đó, đồng bộ sẽ thành **hai chiều**. Đây là thay đổi lớn, nên §11 ghi rõ nó chưa nằm trong phạm vi.

---

## 8. Mô hình dữ liệu

Chi tiết ở `schema-server.sql` (PostgreSQL trên Host) và `schema-client.sql` (SQLite trên máy quầy).

| Bảng | Vai trò |
|---|---|
| `nguoi_dung` | Tài khoản, vai trò, mã PIN |
| `nhom_gia` | Các bậc giá. Cờ `la_si` quyết định đơn có qua đóng hàng không |
| `loai_ca` · `size_ca` · `san_pham` | Danh mục hàng |
| `don_vi_tinh` | Tên đơn vị + **hệ số quy đổi kg** |
| `bang_gia` | **Giá mỗi kg** theo *(sản phẩm, nhóm giá, khoảng ngày)* |
| `khach_hang` | Tên, SĐT, địa chỉ, nhóm giá |
| `cau_hinh_qr` | Tài khoản nhận tiền, có phiên bản, không sửa đè |
| `don_hang` | Đơn, thông tin khách đã chụp, ba trạng thái, dữ liệu thanh toán, nguồn |
| `chi_tiet_don_hang` | Dòng hàng: đơn vị tính + hệ số đã chụp, số lượng, kg dự kiến, kg cân lại, cờ đã đóng |
| `lich_su_sua_don` | Bản chụp trước/sau mỗi lần sửa |
| `lich_su_trang_thai` | Vết đổi trạng thái |

### Cách tính một dòng hàng

```
so_kg_du_kien  = so_luong × he_so_kg          (tự tính khi đặt, FR-DH-06)
so_kg_tinh_tien = COALESCE(so_kg_thuc_te, so_kg_du_kien)
thanh_tien     = so_kg_tinh_tien × don_gia    (don_gia là giá MỖI KG)
```

### Quy ước kiểu dữ liệu

| Loại | PostgreSQL | SQLite |
|---|---|---|
| Tiền | `numeric(18,2)` | `INTEGER` — đồng VND |
| Khối lượng | `numeric(12,3)` kg | `INTEGER` — gram |
| Số lượng theo ĐVT | `numeric(12,3)` | `INTEGER` — phần nghìn |
| Thời điểm | `timestamptz` | `TEXT` ISO 8601 có múi giờ |
| Ngày bán | `date` | `TEXT` `YYYY-MM-DD` |

Không dùng số thực dấu phẩy động cho tiền hoặc khối lượng ở bất kỳ tầng nào.

---

## 9. Yêu cầu phi chức năng

### 9.1 Hiệu năng

Quy mô dự kiến: **300 đơn/ngày × 5 dòng ≈ 110.000 đơn và 550.000 dòng chi tiết mỗi năm**. Ở cỡ này Postgres không cần phân vùng bảng hay materialized view. Chậm hay không nằm ở sáu điều dưới.

| Mã | Yêu cầu |
|---|---|
| HN-01 | `don_hang.tong_tien` **lưu sẵn**. Thống kê ngày chỉ đọc `don_hang`, không bao giờ `JOIN chi_tiet_don_hang`. Quyết định quan trọng nhất về hiệu năng. |
| HN-02 | `ngay_ban` là **cột `date` riêng** do ứng dụng ghi. Lọc `WHERE dat_luc::date = ...` phải quét toàn bảng và còn phụ thuộc múi giờ phiên kết nối. |
| HN-03 | Bảng đóng hàng và danh sách đơn chưa thu dùng **partial index**. Hai truy vấn này chạy liên tục nhưng chỉ chạm vài chục dòng. |
| HN-04 | Thống kê ngày dùng **index phủ** `(ngay_ban) INCLUDE (tong_tien, ...)` → index-only scan. |
| HN-05 | **Không N+1**: lấy chi tiết nhiều đơn bằng một truy vấn `WHERE don_hang_id = ANY($1)`. Đây là nguyên nhân chậm phổ biến nhất và không index nào cứu được. |
| HN-06 | Bảng đóng hàng lấy **toàn bộ đơn kèm mọi dòng hàng trong đúng hai truy vấn**, không phải một truy vấn cho mỗi đơn. |
| HN-07 | `lich_su_sua_don` chỉ index cột tra cứu, **không index nội dung `jsonb`**. |
| HN-08 | Thêm một dòng hàng vào đơn phản hồi dưới 100 ms. |
| HN-09 | Bảng thống kê ngày hiện ra dưới 500 ms. |
| HN-10 | Bảng đóng hàng cập nhật trong 1 giây trên máy quầy, 20 giây trên Host. |

Ngưỡng cần làm thêm — trước đó tối ưu gì cũng chỉ là phức tạp hoá vô ích:

- Hơn 5 triệu dòng `don_hang` → phân vùng theo năm
- Báo cáo cả năm quá 2 giây → thêm bảng tổng hợp ghi sẵn

### 9.2 Khác

| Mã | Yêu cầu |
|---|---|
| PC-01 | Mất Internet: đặt hàng, sinh QR, in phiếu, đóng hàng, sửa đơn, thống kê vẫn chạy đầy đủ. Chỉ web trên Host là không cập nhật. |
| PC-02 | Mất điện đột ngột không làm hỏng CSDL cục bộ (WAL + `synchronous = FULL`). |
| PC-03 | Giao diện tiếng Việt. Tiền `1.234.500 ₫`, khối lượng `32,500 kg`. |
| PC-04 | Thao tác bán hàng dùng được hoàn toàn bằng bàn phím. |
| PC-04b | Giao diện bán hàng thiết kế cho **màn hình cảm ứng**: chọn hàng bằng lưới nút thay vì hộp thả xuống, nhập số bằng bàn phím số trên màn hình, mọi mục bấm được cao tối thiểu **56 px**. |
| PC-04c | Cảm ứng và bàn phím vật lý **dùng song song**, không được bỏ cái nào. Màn hình cảm ứng điện dung nhận sai điểm chạm khi dính nước, mà ở vựa cá tay ướt là chuyện thường ngày. |
| PC-04d | Không dùng thao tác chỉ chuột mới làm được: không hover mới hiện, không bấm chuột phải, không kéo thả bắt buộc. |
| PC-05 | Trạng thái không phân biệt chỉ bằng màu — luôn kèm chữ. |
| PC-06 | Sao lưu `pos.db` hằng ngày. Đơn chưa đồng bộ chỉ tồn tại trong tệp này. |
| PC-07 | Mã QR phải quét được bằng ít nhất ba ứng dụng ngân hàng khác nhau trước khi dùng thật. |

## 10. Rủi ro

| Rủi ro | Mức | Xử lý |
|---|---|---|
| **Máy quầy hỏng** — chỉ có một máy, hỏng là dừng bán | **Cao** | Sao lưu `pos.db` hằng ngày + đẩy lên Host liên tục; chuẩn bị sẵn quy trình bán bằng giấy |
| Nhân viên bấm "đã nhận tiền" khi tiền chưa về | **Cao** | Ghi nhật ký người xác nhận; đối chiếu sao kê cuối ngày qua mã đơn |
| Dữ liệu khách hàng lộ qua trang web trên Host | **Cao** | Bắt buộc đăng nhập (FR-HO-05); không để trang công khai |
| Một khách có hai đơn cùng lúc — bảng không hiện mã đơn nên dễ đóng nhầm | Thấp | Quy tắc FR-SD-09: khách gọi thêm thì sửa đơn cũ. Hệ thống cảnh báo khi mở đơn mới cho khách đang có đơn chờ (FR-SD-10) |
| **Màn hình cảm ứng loạn khi dính nước** — tay ướt, nước bắn lên mặt kính làm máy nhận sai điểm chạm hoặc tự bấm | Trung bình | Luôn giữ bàn phím vật lý dùng song song (PC-04c); cân nhắc màn hình chống nước hoặc dán màng bảo vệ; nút to giúp giảm bấm nhầm |
| Sửa đơn tuỳ tiện sau khi đã chốt | Trung bình | Bắt buộc nhập lý do, lưu bản chụp, giới hạn vai trò |
| Quên cập nhật giá đầu ngày | Trung bình | Sản phẩm chưa có giá hôm nay hiện cảnh báo, không thêm được vào đơn (FR-DM-09) |
| Người xem trên Host tưởng số liệu là thời gian thực | Trung bình | Luôn hiện thời điểm đồng bộ gần nhất (FR-HO-07) |
| Ứng dụng ngân hàng từ chối QR | Trung bình | Thử ba ứng dụng trước khi chạy thật ([`VIETQR.md`](./VIETQR.md) §6) |

## 11. Quyết định đã chốt

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Nhân viên đóng hàng dùng thiết bị riêng hay chung máy quầy? | **Dùng chung máy quầy.** Bảng đóng hàng là cửa sổ thứ hai của ứng dụng POS. Bỏ máy chủ HTTP nhúng và toàn bộ thiết kế LAN. |
| 2 | Bao nhiêu máy quầy? | **Một máy.** Không có xung đột nhiều máy. Đẩy dữ liệu lên Host để xem từ xa. |
| 3 | Bốn nhóm giá mặc định đã đủ chưa? | **Chưa chốt danh sách**, nên phải thêm/sửa được ngay trong phần mềm (FR-NG-02, FR-NG-03). |
| 4 | Khách sỉ trả trước một phần thì ghi nhận thế nào? | **Hoãn.** Bản này chỉ *đã trả / chưa trả*. |
| 5 | Số kg cân lại có cần không? | **Có**, nhưng khi đặt hàng vẫn phải điền sẵn số kg dự kiến tính từ hệ số quy đổi, đúng như project cũ (FR-DH-06, FR-DH-07). |

## 12. Câu hỏi còn treo

1. Host dùng dịch vụ nào? Đề xuất ở [`KIEN-TRUC.md`](./KIEN-TRUC.md) — VPS nhỏ chạy Docker Compose.
2. Ai được xem trang thống kê trên Host — chỉ chủ vựa, hay cả nhân viên?
3. Máy quầy hỏng thì bán bằng gì? Với hệ thống chỉ có một máy, đây là rủi ro lớn nhất và hiện chưa có phương án.
