# Đề Xuất Tính Năng Mới — Quản Lý Vựa Cá

> Tài liệu đề xuất mở rộng hệ thống, xây dựng dựa trên khảo sát codebase hiện tại
> (18 entity, 17 controller, 19 service, 3 scheduler, FE React chia 3 khu vực admin/customer/auth).
>
> Mỗi đề xuất bám vào một **khoảng trống thực tế** được xác định trong mã nguồn, không phải danh sách tính năng chung chung.

## Mục lục

- [Nhóm 1 — Lỗ hổng nghiệp vụ cốt lõi](#nhóm-1--lỗ-hổng-nghiệp-vụ-cốt-lõi-nên-làm-trước)
- [Nhóm 2 — Tăng doanh thu & trải nghiệm](#nhóm-2--tăng-doanh-thu--trải-nghiệm)
- [Nhóm 3 — Vận hành tại quầy & kho](#nhóm-3--vận-hành-tại-quầy--kho)
- [Nhóm 4 — Nền tảng kỹ thuật](#nhóm-4--nền-tảng-kỹ-thuật)
- [Khuyến nghị lộ trình](#khuyến-nghị-lộ-trình)

---

## Nhóm 1 — Lỗ hổng nghiệp vụ cốt lõi (nên làm trước)

### 1. Module Giao hàng & Địa chỉ nhận

**Vấn đề hiện tại**

`Donhang` có trạng thái `DANG_VAN_CHUYEN` nhưng **không có một trường dữ liệu nào về giao hàng** — không địa chỉ nhận, không phí ship, không người giao, không thời gian dự kiến. `Taikhoan.diachi` chỉ lưu được một địa chỉ, giới hạn 80 ký tự.

**Đề xuất**

- Entity `DiaChiGiaoHang`: sổ nhiều địa chỉ cho mỗi khách, có địa chỉ mặc định.
- Bổ sung vào `Donhang`: `idDiaChiGiao`, `phiVanChuyen`, `ngayGiaoDuKien`, `idNguoiGiao`, `ghiChuGiaoHang`.
- Bảng `KhuVucGiaoHang`: phí ship theo khu vực kết hợp theo khối lượng.
- Cách tính `ngayGiaoDuKien`: giờ cắt đơn + số ngày SLA theo khu vực, chặn theo tồn kho, nhảy qua ngày nghỉ. Hiển thị dạng khoảng giờ, không phải mốc cứng. Tính lại khi staff xác nhận đơn.
- Màn hình "Đơn cần giao hôm nay" dành cho STAFF.

**Tại sao ưu tiên**

Đây là mắt xích đứt trong luồng đơn hàng online. Không có dữ liệu giao hàng, trạng thái vận chuyển chỉ là một nhãn trống.

---

### 2. Trả hàng / Khiếu nại / Hoàn tiền

**Vấn đề hiện tại**

Cá là hàng tươi sống — chết dọc đường, thiếu ký, sai size là chuyện thường ngày. Hệ thống hiện **không có đường lùi**: đơn chỉ có thể `GIAO_HANG_THANH_CONG` hoặc `HUY`.

**Đề xuất**

- Entity `PhieuTraHang` + `ChitietTraHang`, có lý do: cá chết / thiếu ký / sai hàng.
- Mở rộng `TrangThaiDonHang`: `KHIEU_NAI`, `DA_HOAN_TIEN`.
- Ba hình thức hoàn tiền: tiền mặt, ghi giảm công nợ, gọi API refund VNPay.
- Khách upload ảnh bằng chứng (hạ tầng Cloudinary đã có sẵn).

---

### 3. Công nợ Nhà cung cấp

**Vấn đề hiện tại**

Hệ thống quản lý công nợ khách sỉ rất kỹ (`Lichsucongno`, hạn mức tín dụng, `CongNoQuaHanScheduler`) nhưng **chiều ngược lại thì không có gì**. `Phieunhap` chỉ có cờ `CHUA_THANH_TOAN` / `DA_THANH_TOAN` ở cấp phiếu — không trả từng phần, không lịch sử, không hạn trả. `Nhacungcap` chỉ có tên và số điện thoại.

Hệ quả lên báo cáo: `tinhTongQuan()` đã có chỉ tiêu `chiPhiNhapDaThanhToan`, nhưng vì lọc theo cờ nhị phân nên phiếu 25 triệu đã trả 10 triệu vẫn đóng góp 0đ — con số luôn báo thiếu.

**Đề xuất**

- Mở rộng `Nhacungcap`: địa chỉ, email, mã số thuế, người liên hệ, hạn trả mặc định, công nợ phải trả.
- Thêm `tongtien` vào `Phieunhap`, chốt cứng tại thời điểm nhập (hiện phải suy ra từ `Σ gianhap × soluongnhap`, sửa chi tiết phiếu là lệch sổ nợ).
- Entity `ThanhToanNhaCungCap` + `LichSuCongNoNCC` — soi gương đúng pattern `Lichsucongno` / `CongNoService`.
- Scheduler nhắc sắp tới hạn trả tiền NCC qua SSE.
- Màn hình `/admin/QuanLyCongNoNCC`.

---

### 4. Báo cáo Lãi/Lỗ và Hao hụt

**Vấn đề hiện tại**

`truLoFifo()` trừ kho theo FIFO đúng và **biết chính xác** lô nào bị trừ bao nhiêu, nhưng chỉ ghi đè `soluongconlai` rồi vứt thông tin đó đi. `Chitietdonhang` không trỏ tới lô, nên **giá vốn không truy ngược được** — và không thể tính lại về sau vì đó là phép ghi đè phá hủy.

Ngoài ra:

- "Hao hụt" trong `tinhLuanChuyenHangHoa()` thực chất là thanh lý + tiêu hủy. Cặp `khoiluongdukien` / `khoiluongthucte` **chưa được so sánh ở bất kỳ báo cáo nào**.
- `doanh thu − chiPhiNhapHang` không phải lãi: chi phí nhập trong kỳ phần lớn còn nằm trong bể chưa bán.

**Đề xuất**

- Entity `PhanBoXuatKho` (dòng đơn ↔ lô ↔ số lượng ↔ giá nhập chốt cứng), ghi ngay trong `truSoLuongTrongDanhSachLo()` và bút toán âm khi hoàn lô.
- Báo cáo **hao hụt cân** theo loại cá × size — làm được ngay, không phụ thuộc gì.
- Báo cáo **biên lợi nhuận** theo lô / loại cá / size, tính trên giá vốn thật.
- Tách bạch trên dashboard: "chi phí mua hàng trong kỳ" và "giá vốn hàng đã bán" là hai chỉ tiêu khác nhau.

---

### 5. Nhật ký thao tác (Audit Log)

**Vấn đề hiện tại**

STAFF có quyền sửa `khoiluongthucte`, điều chỉnh công nợ, đổi hạn mức, mở khóa đặt hàng, xác nhận thanh toán, sửa giá nhập — tức là **trực tiếp tác động tới tiền** — nhưng không để lại vết truy nào. Chỉ riêng `Lichsucongno` có `nguoithuchien`.

**Đề xuất**

- Entity `NhatKyThaoTac`: người thực hiện, hành động, `tenBang` + `idBanGhi`, giá trị cũ → mới (JSON), IP, thời gian.
- Cặp `tenBang` + `idBanGhi` là con trỏ đa hình tới bản ghi bị sửa — tổng quát hóa pattern `nguongocloai` + `nguongocid` đã có trong `Lichsucongno`. Bắt buộc index cặp này.
- Triển khai bằng Spring AOP với annotation `@GhiNhatKy`, không dùng Envers (chỉ ~8 điểm cần log, nhật ký sạch hơn).
- Nhật ký chỉ ghi thêm, không sửa/xóa. Lỗi ghi log không được rollback giao dịch nghiệp vụ.
- Tab "Lịch sử thay đổi" trên màn chi tiết đơn hàng + màn tra cứu cho ADMIN.

---

## Nhóm 2 — Tăng doanh thu & trải nghiệm

### 6. Khuyến mãi & Mã giảm giá

Hiện chỉ có `Banggia` (giá lẻ / giá sỉ theo khoảng ngày) — không có công cụ kích cầu nào.

Đề xuất entity `ChuongTrinhKhuyenMai` / `MaGiamGia`: giảm theo %, giảm số tiền, miễn phí ship, mua X tặng Y, giới hạn lượt dùng, áp riêng cho nhóm khách sỉ hoặc lẻ.

Đặc biệt hữu ích để đẩy nhanh **lô sắp quá hạn** thay vì phải thanh lý lỗ.

### 7. Đánh giá sản phẩm & phản hồi

Chưa có entity nào phục vụ việc này. Với vựa cá, đánh giá kèm ảnh tạo niềm tin về độ tươi. Chỉ cho phép đánh giá khi đơn đã ở trạng thái `GIAO_HANG_THANH_CONG`.

### 8. Đặt lại đơn cũ & Đơn định kỳ (cho khách sỉ)

Nhà hàng và quán ăn đặt gần như cùng một giỏ mỗi ngày.

- Nút **"Đặt lại"** từ đơn cũ.
- **Lịch đặt định kỳ**: tự sinh đơn `CHO_XAC_NHAN` mỗi sáng.

Đây là tính năng giữ chân khách sỉ mạnh nhất với chi phí phát triển thấp.

### 9. Thông báo qua Zalo ZNS / SMS

Hiện chỉ có email và SSE — mà SSE chỉ hoạt động khi khách đang mở web. Khách vựa cá phần lớn dùng Zalo.

Gửi ZNS tại các mốc: xác nhận đơn, đang giao, nhắc công nợ đến hạn.

### 10. Tìm kiếm & lọc sản phẩm nâng cao

Trải nghiệm mua hàng ở `DanhSachSanPham.jsx` còn cơ bản. Bổ sung: lọc theo khoảng giá / size / loại, sắp xếp, gợi ý tìm kiếm, sản phẩm liên quan.

---

## Nhóm 3 — Vận hành tại quầy & kho

### 11. POS nâng cao: Ca làm việc & Kết ca

Hệ thống có bán hàng tại quầy nhưng **không có khái niệm ca làm việc**.

Entity `CaLamViec`: mở ca (ghi tiền đầu ca) → chốt ca (đối chiếu tiền mặt thực đếm với số liệu hệ thống, ghi nhận chênh lệch). Đây là biện pháp kiểm soát thất thoát tiền mặt căn bản của mọi cửa hàng.

### 12. Cảnh báo tồn kho thông minh

`LoHangQuaHanScheduler` hiện chỉ báo **khi lô đã quá hạn** — thời điểm đó thì đã lỗ.

Bổ sung định mức tồn tối thiểu / tối đa cho `Chitietcaban`, cảnh báo trước N ngày, gợi ý nhập hàng dựa trên tốc độ bán.

### 13. Quản lý chi phí vận hành

Dashboard hiện chỉ tính chi phí nhập hàng. Vựa cá còn tốn đá, điện, oxy, xăng xe, nhân công — nếu không đưa vào, con số "lãi" luôn là con số ảo.

Một entity `ChiPhiVanHanh` đơn giản là đủ.

### 14. App/PWA cho nhân viên kho

Việc cân cá và nhập `khoiluongthucte` đang phải thực hiện trên máy tính. Chuyển FE React hiện tại sang PWA có chi phí thấp, cho phép nhân viên cân — nhập — chụp ảnh ngay tại bể.

---

## Nhóm 4 — Nền tảng kỹ thuật

| Tính năng | Ghi chú |
|---|---|
| 2FA cho ADMIN | Tài khoản admin nắm toàn bộ tiền và công nợ |
| Rate limiting đăng nhập / API | Redis đã có sẵn, chi phí bổ sung rất thấp |
| Quản lý phiên đăng nhập | Xem và thu hồi các thiết bị đang đăng nhập |
| Trang cấu hình hệ thống | Thông tin vựa, số tài khoản ngân hàng, phí ship, banner — hiện hardcode trong `.env` (`VITE_BANK_*`) |
| Sao lưu DB tự động | Dữ liệu công nợ và đơn hàng hiện không có bản dự phòng |
| Soft-delete & khôi phục | Mới chỉ `Chitietcaban` có cờ `deleted` |

---

## Khuyến nghị lộ trình

| Giai đoạn | Thời lượng | Nội dung | Mục tiêu |
|---|---|---|---|
| 1 | 2–3 tuần | Giao hàng & địa chỉ → Trả hàng/hoàn tiền → Audit log | Bịt lỗ hổng nghiệp vụ |
| 2 | 2–3 tuần | Công nợ NCC → Báo cáo lãi/lỗ & hao hụt → Chi phí vận hành | Làm chủ dòng tiền |
| 3 | 2–3 tuần | Khuyến mãi → Đặt lại/đơn định kỳ → Đánh giá → Zalo ZNS | Tăng trưởng |
| 4 | — | Ca làm việc, cảnh báo tồn kho, 2FA, cấu hình hệ thống | Vận hành & kỹ thuật |

### Nếu chỉ chọn 3 việc làm ngay

1. **Module giao hàng** — vá đứt gãy trong luồng đơn hàng.
2. **Trả hàng / hoàn tiền** — vá đứt gãy trong xử lý sự cố hàng tươi sống.
3. **Báo cáo lãi–lỗ & hao hụt** — biến dữ liệu đang nằm chết trong DB thành thông tin ra quyết định.
