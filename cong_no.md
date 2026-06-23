# Hệ thống Quản lý Công nợ — Thiết kế tổng thể

> Trạng thái: đang chốt thiết kế, chưa code.

---

## 1. Mục tiêu & phạm vi

- Theo dõi công nợ riêng từng khách hàng (mua hàng trả sau / công nợ).
- Giới hạn theo hạn mức tín dụng riêng từng khách.
- Tự động cảnh báo khi gần/vượt hạn mức, tự động khóa đặt hàng khi vượt hạn mức quá lâu.
- Admin luôn là người quyết định cuối với các trường hợp biên (cho vượt hạn mức có kiểm soát, mở khóa thủ công, điều chỉnh nợ...). Hệ thống không tự huỷ đơn, không tự trừ tiền ngoài ý muốn.
- **Chỉ áp dụng cho khách sỉ có tài khoản** (`idtaikhoan`). Khách lẻ (đặt hàng bằng `tenKhachLe`/`sdtKhachLe`, không có tài khoản) không tham gia cơ chế công nợ.

---

## 2. Khái niệm & định nghĩa nợ

Phải tách rõ 2 khái niệm "nợ" dùng cho 2 mục đích khác nhau — dùng lẫn 2 khái niệm này là lỗ hổng nghiêm trọng nhất nếu xảy ra:

### 2.1 Nợ thực tế (nợ đã chốt)

Dùng để hiển thị, báo cáo, tính cảnh báo và tính ngày vượt hạn mức.

```
Nợ thực tế = Tổng giá trị đơn hàng đã GIAO_HANG_THANH_CONG
           − Tổng tiền đã thanh toán (thanhtoan.trangthai = DA_THANH_TOAN)
```

**Lưu ý quan trọng về tên trường (đã kiểm tra trong code hiện tại):** enum `TrangThaiDonHang` (trường `donhang.trangthaidonhang`) và enum `TrangThaiThanhToan` (trường `thanhtoan.trangthai`) **đều có một giá trị tên là `DA_THANH_TOAN` nhưng ý nghĩa khác hẳn nhau**:

| Trường | Ý nghĩa của `DA_THANH_TOAN` |
|---|---|
| `donhang.trangthaidonhang` | Đơn đã được khách trả tiền ngay lúc đặt — thuộc luồng mua thường, không phải công nợ |
| `thanhtoan.trangthai` | Một bản ghi thanh toán (có thể nhiều bản ghi, trả dần/trả góp) đã được xác nhận |

→ Công thức tính nợ **phải** dùng `thanhtoan.trangthai`, không được dùng `donhang.trangthaidonhang`, vì một đơn công nợ có thể được trả nhiều lần/trả một phần qua nhiều bản ghi `thanhtoan`.

**Trường hợp khách chuyển dư tiền (overpayment):** công thức `cong_no_hien_tai -= sotien` ở mục 4 đã tự xử lý được — nếu `sotien` xác nhận lớn hơn `cong_no_hien_tai` hiện tại, kết quả chỉ đơn giản là **số âm**, coi như số dư trả trước (credit) của khách, sẽ tự trừ dần vào lần phát sinh nợ kế tiếp (mục 5.2). Không cần cơ chế riêng, nhưng:
- Không giới hạn/chặn admin xác nhận `thanhtoan` có `sotien` lớn hơn nợ hiện tại.
- UI (mục 7) khi `cong_no_hien_tai` âm phải hiển thị **"Số dư trả trước: X đ"**, không hiển thị "Nợ: -X đ" — tránh gây hoang mang cho khách/admin.

### 2.2 Nợ dự kiến (real-time, không cache)

Dùng riêng để chặn checkout, không dùng cho hiển thị/báo cáo.

```
Nợ dự kiến = Nợ thực tế
           + Tổng giá trị đơn đang xử lý (CHO_XAC_NHAN, DA_THANH_TOAN, DANG_DONG_HANG, DANG_VAN_CHUYEN)
           + Giá trị giỏ hàng hiện tại
```

Nếu chỉ check "Nợ thực tế" lúc đặt hàng, khách có thể đặt nhiều đơn liên tiếp — mỗi đơn riêng lẻ chưa làm nợ thực tế vượt hạn mức (vì các đơn trước chưa giao) — và tổng nợ chỉ vọt lên vượt xa hạn mức khi các đơn đó được giao cùng lúc.

---

## 3. Cấu trúc dữ liệu cần thêm

### 3.1 Bảng `taikhoan` — thêm 3 cột

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `hanmuc_tin_dung` | `DECIMAL(12,2)` | Hạn mức tín dụng riêng từng khách. NULL/0 = không cho mua công nợ |
| `cong_no_hien_tai` | `DECIMAL(12,2) DEFAULT 0` | Cache của "Nợ thực tế" (mục 2.1). Cập nhật bằng event, **không** tính lại bằng `SUM()` mỗi lần đọc |
| `ngay_vuot_han_muc` | `DATETIME NULL` | Ngày đầu tiên ghi nhận nợ thực tế vượt 100% hạn mức. NULL = đang trong hạn mức |

### 3.2 Cấu hình toàn hệ thống (bảng config riêng hoặc `application.properties`)

- `phan_tram_canh_bao` — % hạn mức bắt đầu cảnh báo (mặc định 80%)
- `so_ngay_khoa` — số ngày vượt hạn mức liên tục trước khi tự khóa (mặc định 30 ngày)

Để 2 giá trị này áp dụng chung toàn hệ thống trước; nếu sau này cần tùy biến theo từng khách thì mới thêm cột riêng vào `taikhoan`.

### 3.3 Bảng `lich_su_cong_no` (sổ cái công nợ — bắt buộc, không phải tùy chọn)

`cong_no_hien_tai` chỉ là 1 con số mutable — nếu có sai số, không ai truy được vì sao nợ của khách lại đổi từ X sang Y. Phải có sổ cái ghi lại từng lần biến động:

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | `VARCHAR(36)` | PK |
| `idtaikhoan` | `VARCHAR(36)` | FK tới `taikhoan` |
| `loai_thay_doi` | `ENUM('TANG','GIAM','DIEU_CHINH')` | Tăng (đơn giao thành công), Giảm (thanh toán), Điều chỉnh thủ công |
| `so_tien` | `DECIMAL(12,2)` | Số tiền biến động (luôn dương, dấu xác định qua `loai_thay_doi`) |
| `so_du_sau_khi_thay_doi` | `DECIMAL(12,2)` | Giá trị `cong_no_hien_tai` ngay sau khi áp dụng dòng này — để đối soát nhanh không cần tính lại |
| `nguon_goc` | `VARCHAR(36)` + loại nguồn (`iddonhang` / `idthanhtoan` / `null` nếu điều chỉnh thủ công) | Tham chiếu tới đơn hàng hoặc bản ghi thanh toán gây ra biến động |
| `nguoi_thuc_hien` | `VARCHAR(36)`, NULL | `idtaikhoan` của admin — chỉ có giá trị khi `loai_thay_doi = DIEU_CHINH` |
| `ghichu` | `VARCHAR(255)`, NULL | Lý do — bắt buộc khi điều chỉnh thủ công |
| `ngay_tao` | `DATETIME` | Thời điểm ghi nhận |

**Mọi lần `cong_no_hien_tai` thay đổi đều phải insert đúng 1 dòng vào bảng này, trong cùng transaction.** Đây là nguồn để giải trình khi khách/kế toán thắc mắc, và cũng là cách phục hồi `cong_no_hien_tai` nếu lệch (replay lại từ `lich_su_cong_no`).

---

## 4. Cơ chế cập nhật `cong_no_hien_tai`

Để tránh query `SUM()` nặng mỗi lần load trang (sẽ chết khi data phình to), `cong_no_hien_tai` chỉ được cập nhật tại các thời điểm sau, trong cùng transaction với hành động nghiệp vụ, ở **tầng service Spring** (không dùng DB trigger, để logic dễ đọc/dễ test/dễ debug):

1. Đơn hàng chuyển trạng thái → `GIAO_HANG_THANH_CONG`: `cong_no_hien_tai += tổng giá trị đơn đó` + insert `lich_su_cong_no` (`TANG`, `nguon_goc` = đơn hàng)
2. Một bản ghi `thanhtoan` được xác nhận → `trangthai = DA_THANH_TOAN`: `cong_no_hien_tai -= sotien` + insert `lich_su_cong_no` (`GIAM`, `nguon_goc` = bản ghi thanh toán)
3. Admin điều chỉnh thủ công (mục 5.5): `cong_no_hien_tai +/- số tiền` + insert `lich_su_cong_no` (`DIEU_CHINH`, `nguoi_thuc_hien` = admin, `ghichu` bắt buộc)

Câu lệnh update phải là tăng/giảm tại DB:

```sql
UPDATE taikhoan SET cong_no_hien_tai = cong_no_hien_tai + ? WHERE idtaikhoan = ?
```

không phải đọc giá trị hiện tại ra, cộng ở tầng app, rồi ghi lại — để tránh **lost update** khi có nhiều giao dịch xảy ra đồng thời trên cùng một khách hàng.

---

## 5. Flow chính

### 5.1 Khách đặt hàng (checkout)

```
→ Tài khoản đang bị khóa đặt hàng? 
    → Có → Từ chối, hiển thị lý do + số tiền cần trả tối thiểu để mở khóa
→ Tính Nợ dự kiến = cong_no_hien_tai + tổng đơn đang xử lý + giá trị giỏ hàng
  (tính real-time trong transaction, có lock theo khách hàng)
→ Nợ dự kiến > hạn mức?
    → Không → Cho đặt hàng
    → Có → Chặn, không tạo đơn
           (hoặc: cho admin tạo đơn thủ công kèm xác nhận vượt hạn mức — tuỳ chính sách quyết định sau)
```

Cần lock theo khách hàng (`SELECT ... FOR UPDATE` trên row `taikhoan`) trong transaction tạo đơn, để 2 request đặt hàng gần như đồng thời không cùng đọc một giá trị "nợ dự kiến" cũ và đều pass check.

### 5.2 Đơn hàng được giao thành công

```
→ donhang.trangthaidonhang = GIAO_HANG_THANH_CONG
→ Khách (qua donhang.idthongtinkhachhang) có hanmuc_tin_dung được set (khác NULL/0)?
    → Không → Bỏ qua, đơn này không tham gia công nợ (khách lẻ hoặc khách sỉ chưa mở công nợ)
    → Có → cong_no_hien_tai += tổng giá trị đơn (+ insert lich_su_cong_no)
           → Nếu cong_no_hien_tai > hạn mức và ngay_vuot_han_muc đang NULL → set ngay_vuot_han_muc = thời điểm hiện tại
```

**Lưu ý quan trọng:** `TrangThaiDonHang` (`CHO_XAC_NHAN → DA_THANH_TOAN → DANG_DONG_HANG → DANG_VAN_CHUYEN → GIAO_HANG_THANH_CONG`) là **một pipeline tuyến tính dùng chung cho mọi đơn** (đã kiểm tra trong code hiện tại) — không có nhánh riêng "đơn trả ngay" vs "đơn công nợ". Vì vậy bắt buộc phải có điều kiện lọc theo `hanmuc_tin_dung` như trên ở bước này, nếu không mọi đơn giao thành công (kể cả của khách không dùng công nợ) đều bị cộng nhầm vào `cong_no_hien_tai`.

### 5.3 Khách thanh toán (admin/kế toán xác nhận — một phần hoặc toàn bộ)

```
→ thanhtoan.trangthai = DA_THANH_TOAN
  (admin xác nhận thủ công nếu là tiền mặt/chuyển khoản, hoặc tự động nếu qua cổng online)
→ cong_no_hien_tai -= sotien (+ insert lich_su_cong_no)
→ Nếu cong_no_hien_tai <= hạn mức → set ngay_vuot_han_muc = NULL (đã thoát trạng thái vượt hạn mức)
```

**Mốc reset `ngay_vuot_han_muc` là 100% hạn mức, không phải mốc cảnh báo 80%.** Banner cảnh báo 80% chỉ là trạng thái tính tại thời điểm hiển thị (so sánh `cong_no_hien_tai` với `hanmuc_tin_dung` lúc render), không cần lưu field riêng.

**Nút "Xác nhận thanh toán" cho 1 đơn công nợ chỉ nên bật sau khi đơn đó đã `GIAO_HANG_THANH_CONG`** (không bật sớm hơn). Vì nợ chỉ thực sự phát sinh ở bước 5.2 (giao hàng xong), nếu admin xác nhận thanh toán trước đó thì `cong_no_hien_tai -=` chạy trước `+=` của cùng đơn, dẫn đến số dư bị sai thứ tự (tạm thời thành số dư trả trước, rồi đơn giao xong mới cộng nợ lên — dễ gây nhầm lẫn khi đối soát, dù kết quả cuối cùng vẫn đúng).

### 5.4 Scheduled job chạy mỗi ngày (Spring `@Scheduled`)

```
→ Quét các taikhoan có ngay_vuot_han_muc khác NULL
→ Nếu (hôm nay − ngay_vuot_han_muc) > so_ngay_khoa → khóa đặt hàng (không khóa đăng nhập)
```

Job này chỉ đọc và khóa; việc set `ngay_vuot_han_muc` đã xảy ra ở bước 5.2, không lặp lại ở đây.

### 5.5 Admin điều chỉnh công nợ thủ công

```
→ Admin nhập: idtaikhoan, số tiền cộng/trừ, lý do (bắt buộc)
→ cong_no_hien_tai +/- số tiền
→ insert lich_su_cong_no (loai_thay_doi = DIEU_CHINH, nguoi_thuc_hien = idtaikhoan admin, ghichu = lý do)
```

Dùng cho chiết khấu cuối tháng, bồi thường thiện chí, làm tròn số lẻ — các trường hợp phát sinh ngoài luồng Đặt hàng/Thanh toán.

---

## 6. Phân cấp cảnh báo

| Mức | Điều kiện | Hành động |
|---|---|---|
| Bình thường | Nợ thực tế < 80% hạn mức | Cho đặt hàng bình thường |
| Cảnh báo | Nợ thực tế ≥ 80% hạn mức | Banner vàng cho khách, admin nhận thông báo |
| Nguy hiểm | Nợ thực tế ≥ 100% hạn mức | Banner đỏ cho khách, admin nhận alert, `ngay_vuot_han_muc` được set |
| Bị khóa | Vượt hạn mức liên tục > `so_ngay_khoa` ngày | Không đặt được hàng mới, hiển thị lý do + số tiền cần trả tối thiểu để mở khóa |

---

## 7. Giao diện cần làm

**Phía admin:**
- Dashboard công nợ: danh sách khách hàng, cột nợ thực tế / hạn mức / % / số ngày vượt
- Chỉnh hạn mức tín dụng từng khách
- Xác nhận thanh toán (tiền mặt/chuyển khoản thủ công)
- Nút mở khóa thủ công (trường hợp đặc biệt)
- Điều chỉnh công nợ thủ công (nhập số tiền cộng/trừ + lý do)
- Xem lịch sử biến động công nợ của từng khách (từ bảng `lich_su_cong_no`)

**Phía khách:**
- Hiển thị "Công nợ hiện tại: X / Hạn mức: Y" ở trang đơn hàng/profile
- Banner cảnh báo khi gần hoặc vượt hạn mức
- Nếu bị khóa: thông báo rõ lý do + số tiền cần trả tối thiểu để mở khóa

---

## 8. Điểm cần chú ý

- **Nợ thực tế** (mục 2.1) dùng để hiển thị/cảnh báo/khóa; **Nợ dự kiến** (mục 2.2, có cộng đơn đang xử lý + giỏ hàng) chỉ dùng để chặn checkout — không dùng lẫn 2 khái niệm này.
- Phân biệt `donhang.trangthaidonhang` (trạng thái đơn) và `thanhtoan.trangthai` (trạng thái thanh toán) — công nợ trừ theo cái thứ hai.
- `cong_no_hien_tai` là cache, cập nhật bằng tăng/giảm tại DB trong transaction; không recompute bằng `SUM()` khi đọc. Mọi thay đổi đều phải kèm 1 dòng `lich_su_cong_no` để có thể truy vết/giải trình.
- Khóa đặt hàng ≠ khóa tài khoản — khách vẫn đăng nhập, xem đơn cũ được, chỉ không tạo đơn mới.
- Thanh toán tiền mặt/chuyển khoản cần admin xác nhận thủ công trước khi trừ nợ; thanh toán online (VNPay...) có thể tự động xác nhận qua callback.
- Cần lock theo khách hàng ở mức transaction khi check + tạo đơn, để tránh race condition giữa 2 đơn đặt gần như đồng thời.
- Đơn đang xử lý bị hủy phải được loại khỏi "Nợ dự kiến" ngay (không cần chờ job nào), vì nó được tính real-time mỗi lần checkout.
- **Hệ thống hiện tại chưa có luồng trả hàng/hoàn hàng sau khi giao** (không có trạng thái nào kiểu `HOAN_TRA` trong toàn bộ module đơn hàng, đã kiểm tra trong code). Vì vậy thiết kế này chưa có hook trừ ngược `cong_no_hien_tai` khi hàng bị trả lại — đây là giới hạn đã biết, chỉ bổ sung khi nào module đơn hàng có luồng trả hàng riêng.

---

## 9. Lộ trình triển khai (từng bước, chưa code)

- **Phase 0** — Chốt thiết kế (tài liệu này).
- **Phase 1** — Migration:
  - Thêm 3 cột vào `taikhoan` (`hanmuc_tin_dung`, `cong_no_hien_tai`, `ngay_vuot_han_muc`)
  - Tạo bảng `lich_su_cong_no`
  - Thêm cấu hình `phan_tram_canh_bao`, `so_ngay_khoa`
  - **Script backfill một lần (one-off):** với từng khách sỉ đang có dữ liệu cũ, dùng `SUM()` (đơn đã giao trừ đã thanh toán từ trước tới nay) để tính `cong_no_hien_tai` khởi tạo đúng, và ghi 1 dòng "khởi tạo" tương ứng vào `lich_su_cong_no` cho từng khách — nếu bỏ bước này, mặc định `DEFAULT 0` sẽ xoá sạch công nợ cũ của mọi khách sỉ.
- **Phase 2** — Service tính & cập nhật `cong_no_hien_tai` (kèm ghi `lich_su_cong_no` cùng transaction): hook vào nơi đơn chuyển `GIAO_HANG_THANH_CONG` và nơi `thanhtoan` được xác nhận.
- **Phase 3** — Hiển thị nợ/hạn mức cho khách (trang đơn hàng/profile).
- **Phase 4** — Chặn checkout theo Nợ dự kiến (fix lỗ hổng đơn đang chờ) + chặn khi tài khoản đang bị khóa.
- **Phase 5** — Dashboard công nợ cho admin (danh sách, %, số ngày vượt, chỉnh hạn mức, xác nhận thanh toán, mở khóa thủ công, điều chỉnh công nợ thủ công, xem lịch sử `lich_su_cong_no`).
- **Phase 6** — Banner cảnh báo 80%/100% (UI khách + thông báo admin).
- **Phase 7** — Scheduled job tự động khóa sau X ngày vượt hạn mức.
- **Phase 8** — Test các trường hợp biên: thanh toán một phần, đặt 2 đơn đồng thời, hủy đơn đang xử lý, admin mở khóa/điều chỉnh thủ công giữa kỳ, đối chiếu `cong_no_hien_tai` luôn khớp tổng `lich_su_cong_no`.

Nên bắt đầu từ **Phase 1 → 2** trước (nền dữ liệu + sổ cái), vì mọi phase sau đều phụ thuộc vào `cong_no_hien_tai` đã đúng, đáng tin và có thể truy vết.

---

## 10. Lưu ý kỹ thuật khi triển khai

Thiết kế đã ổn về nghiệp vụ; đây là các "bẫy" kỹ thuật cần tránh khi chuyển sang code.

### 10.1 Không giữ lock `taikhoan` qua lệnh gọi ngoài

Transaction chứa `SELECT ... FOR UPDATE` (mục 5.1) chỉ nên gồm tính toán nội bộ + ghi DB. Nếu sau này flow checkout có gọi API ngoài (VNPay, đơn vị vận chuyển...), phải đưa lệnh gọi đó ra khỏi transaction này — nếu không, một API ngoài bị treo sẽ giữ khóa trên dòng `taikhoan` đó, làm các request khác của cùng khách bị chờ theo. (Hiện tại `DonhangService` chưa gọi API ngoài trong transaction tạo đơn, nên đây là nguyên tắc cần giữ khi mở rộng, không phải lỗi đang tồn tại.)

### 10.2 Idempotency cho webhook thanh toán

Cổng thanh toán online (VNPay...) có thể bắn callback "thành công" nhiều lần cho cùng 1 giao dịch khi mạng chập chờn. Nếu cứ nhận callback là trừ nợ, khách sẽ bị trừ nhiều lần.

Cách chặn: dùng update có điều kiện ngay trên bảng `thanhtoan` làm cờ chống lặp, không dựa vào việc query `lich_su_cong_no`:

```sql
UPDATE thanhtoan SET trangthai = 'DA_THANH_TOAN'
WHERE idthanhtoan = ? AND trangthai <> 'DA_THANH_TOAN'
```

Chỉ trừ `cong_no_hien_tai` và ghi `lich_su_cong_no` khi câu update trên ảnh hưởng đúng 1 dòng; các lần callback lặp lại sau đó update 0 dòng → bỏ qua, trả về HTTP 200 cho cổng thanh toán.

### 10.3 Dùng `BigDecimal`, không dùng 0`Double`/`Float`

Mọi biến liên quan đến tiền (`cong_no_hien_tai`, `hanmuc_tin_dung`, `so_tien`...) phải dùng `java.math.BigDecimal` ở tầng Java, tính toán bằng `.add()`/`.subtract()` — `Double`/`Float` gây sai số dấu phẩy động (ví dụ `100.00 - 99.90` có thể ra `0.099999999999994` thay vì `0.10`).

### 10.4 `Donhang.idthongtinkhachhang` thực chất là `idtaikhoan`

Tên field gây hiểu nhầm (tưởng là FK tới 1 bảng "thông tin khách hàng" riêng) nhưng `DonhangService` hiện tại dùng thẳng `taikhoanRepository.findById(donhang.getIdthongtinkhachhang())` — giá trị lưu trong cột này chính là `Taikhoan.idtaikhoan`. `NULL` = khách lẻ (không có tài khoản, dùng `tenKhachLe`/`sdtKhachLe`). Khi implement bước check `hanmuc_tin_dung` ở mục 5.1 và 5.2, join trực tiếp qua field này, không cần thêm cột/bảng liên kết mới.

### 10.5 Đánh index cho `lich_su_cong_no`

Bảng này phình to nhanh nhất trong toàn hệ thống (mỗi lần đổi nợ là 1 dòng). Cần `INDEX(idtaikhoan)` và `INDEX(ngay_tao DESC)` ngay trong script tạo bảng ở Phase 1, để màn xem lịch sử công nợ của admin không bị chậm dần theo thời gian.
