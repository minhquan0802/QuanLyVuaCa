# POS Vựa Cá — Quyết định công nghệ

> Nhánh `POS`. Xây lại từ đầu, không kế thừa mã nguồn của `main`/`NewFE`.
> Yêu cầu chức năng nằm ở [`DAC-TA.md`](./DAC-TA.md). File này chỉ giải thích **chọn công nghệ gì và tại sao**.

## Ràng buộc

| Ràng buộc | Giá trị |
|---|---|
| Thiết bị | Máy tính Windows đặt tại quầy |
| Offline | **Bắt buộc** — mất Internet vẫn phải đặt đơn, in phiếu, đóng hàng |
| Phần cứng | Máy in phiếu nhiệt |
| Màn hình đóng hàng | Tab trình duyệt riêng, dạng bảng, tự cập nhật |
| Quy mô | Cá nhân tự làm |

## Stack

### Máy quầy

| Thành phần | Chọn | Lý do |
|---|---|---|
| Vỏ ứng dụng | **Tauri 2** | ~10 MB thay vì ~150 MB của Electron, chạy suốt ngày trên máy quầy đời thấp. Cần Rust để in ESC/POS và để nhúng máy chủ HTTP phục vụ màn hình đóng hàng. |
| Giao diện | **React 19 + TypeScript + Vite 6 + Tailwind 4** | TypeScript bắt buộc ở đây (khác `client/` cũ vốn là JS thuần): gói tin đồng bộ sai một field là mất đơn của khách. |
| DB cục bộ | **SQLite** qua `tauri-plugin-sql` | Nơi chứa đơn khi mất mạng. WAL + `synchronous = FULL`. |
| State | **Zustand** (đơn đang gõ) + **TanStack Query** (dữ liệu từ máy chủ) | Đơn đang gõ là state cục bộ thuần, đừng nhét vào cache mạng. |
| Bảng đóng hàng | **Cửa sổ Tauri thứ hai**, đọc thẳng SQLite | Nhân viên đóng hàng dùng chung máy quầy nên không cần máy chủ mạng. Xem mục dưới. |
| In phiếu | Rust gửi raw **ESC/POS** qua winspool | Không phụ thuộc trình duyệt, in được khi offline. |
| Lưu token | **OS keychain** (`tauri-plugin-stronghold`) | App desktop không có cookie jar; không lưu token vào SQLite. |

### Máy chủ trung tâm

| Thành phần | Chọn | Lý do |
|---|---|---|
| Runtime | **NestJS 11 + TypeScript** | Cùng ngôn ngữ với máy quầy → dùng chung một bộ **Zod schema** validate gói tin đồng bộ ở cả hai đầu. Cấu trúc module/DI giống Spring nên chuyển từ Spring Boot sang không sốc. |
| ORM | **Drizzle** | Schema TypeScript ánh xạ 1:1 với DDL, migration là file `.sql` sửa tay được — cần thiết vì lược đồ dùng `EXCLUDE` constraint và partial index mà ORM khác không diễn đạt nổi. |
| CSDL | **PostgreSQL 17** | Xem mục dưới. |
| Monorepo | **npm workspaces**: `apps/pos`, `apps/server`, `packages/shared` | `packages/shared` giữ kiểu dữ liệu và logic nghiệp vụ dùng chung. Dùng npm thay pnpm vì Node 22 đã có sẵn npm — bớt một thứ phải cài. |

Máy chủ trung tâm chỉ để **lưu trữ và tra cứu từ xa**. Không có nó, quầy vẫn hoạt động đầy đủ. Nếu chỉ có một máy quầy, có thể lùi hẳn phần này lại làm sau.

## Ba lý do đổi MySQL → PostgreSQL

Không phải vì Postgres "xịn hơn". Vì đúng ba thứ thiết kế này dựa vào mà MySQL 8 không có:

1. **`EXCLUDE USING gist` trên `daterange`** — DB tự chặn hai bảng giá chồng lấn ngày cho cùng một *(sản phẩm, nhóm giá)* (FR-DM-04). Với nhiều bậc giá sỉ, số tổ hợp có thể chồng lấn tăng lên, chặn bằng mã nguồn càng dễ sai.
2. **Partial index** — `WHERE trang_thai_dong IN ('CHO_DONG','DANG_DONG')` cho truy vấn nóng nhất hệ thống là hàng đợi đóng hàng. MySQL không hỗ trợ.
3. **`jsonb`** — giữ nguyên gói tin đồng bộ và bản chụp sửa đơn.

Cộng thêm `numeric` chuẩn, generated column (`thanh_tien`, `chenh_lech_tt`), `FILTER (WHERE ...)` cho thống kê ngày, và **index phủ `INCLUDE`** giúp thống kê doanh thu chạy index-only scan.

## Nhiều bậc giá sỉ

Cách phân loại sỉ/lẻ nhị phân của v1.0 không đủ. Thay bằng bảng `nhom_gia`: `LE`, `SI_GAN`, `SI_XA`, `SI_VIP`, thêm bậc mới là thêm một dòng dữ liệu chứ không sửa mã nguồn. Cờ `nhom_gia.la_si` là thứ quyết định đơn có phải qua bước đóng hàng hay không.

Kéo theo: `bang_gia` không còn hai cột `gia_le`/`gia_si` mà thành một dòng cho mỗi *(sản phẩm, nhóm giá, khoảng ngày)*. Giá cá đổi gần như hằng ngày, nên bảng này lớn nhanh nhất hệ thống — nhưng vẫn rất nhỏ: 20 sản phẩm × 4 nhóm × 365 ngày ≈ 29.000 dòng/năm.

## VietQR sinh cục bộ

Nhánh `NewFE` gọi `img.vietqr.io` để lấy ảnh QR. Cách đó không dùng lại được vì mất Internet là ô ảnh trắng trơn, xung đột trực tiếp với yêu cầu offline. Chuỗi VietQR chỉ là chuỗi EMVCo cộng CRC-16, **sinh được hoàn toàn cục bộ**, chạy được cả online lẫn offline. Chi tiết ở [`VIETQR.md`](./VIETQR.md).

Thông tin tài khoản nhận chuyển từ biến môi trường (`VITE_BANK_ID`…) vào bảng `cau_hinh_qr` để sửa được ngay trong phần mềm, và **không bao giờ sửa đè** — đổi tài khoản là thêm dòng mới, để đơn cũ vẫn tra ra đúng tài khoản đã thật sự nhận tiền.

## Hình dạng hệ thống

```
        MÁY QUẦY (duy nhất, Tauri + SQLite)
        ├── Cửa sổ 1: bán hàng
        ├── Cửa sổ 2: BẢNG ĐÓNG HÀNG      ← nhân viên đóng hàng dùng chung máy
        └── Thống kê
                 │
                 │  đẩy đơn + thống kê, mỗi 15 giây khi có mạng
                 ▼
        HOST (VPS)
        ├── API (NestJS) + PostgreSQL
        └── Web chỉ đọc:  /dong-hang   bảng đóng hàng, xem từ xa
                          /thong-ke    thống kê
```

### Đã bỏ máy chủ HTTP nhúng của v1.1

Bản v1.1 thiết kế một máy chủ Axum nhúng để phục vụ bảng đóng hàng qua mạng LAN. **Không cần nữa**: nhân viên đóng hàng dùng chung đúng máy quầy, nên bảng đóng hàng chỉ là **cửa sổ thứ hai của chính ứng dụng POS**, đọc thẳng SQLite.

Bỏ được luôn: Axum, tokio, IP tĩnh, cấu hình Windows Firewall, và rủi ro để tên cùng số điện thoại khách hàng chạy trần trong mạng LAN không cần đăng nhập.

### Một giao diện, hai nguồn dữ liệu

Bảng đóng hàng và bảng thống kê **dùng chung một bộ component React**, chỉ khác lớp lấy dữ liệu:

| Chạy ở đâu | Nguồn dữ liệu | Cần Internet |
|---|---|---|
| Cửa sổ thứ hai trên máy quầy | SQLite cục bộ | Không |
| Trang web trên Host | API của Host | Có |

Viết một `interface NguonDuLieu` với hai cài đặt — `NguonSQLite` và `NguonHTTP` — rồi component chỉ nhận dữ liệu đã chuẩn hoá. Sửa bố cục bảng một lần, cả hai nơi cùng đổi.

## Host

Chỉ có một máy quầy nên Host **không phải nơi điều phối**, chỉ là nơi chứa bản sao để xem từ xa. Máy quầy vẫn là nguồn sự thật.

**Đề xuất: một VPS nhỏ (~5 USD/tháng) chạy Docker Compose** — Caddy (HTTPS tự động) + NestJS + PostgreSQL + web tĩnh. Một hộp duy nhất để quản, cơ sở dữ liệu nằm cùng máy nên nhanh, không có chuyện ngủ đông rồi khởi động lại chậm như các gói miễn phí.

Phương án thay thế nếu không muốn quản máy chủ: Railway hoặc Render kèm Postgres của họ. Đắt hơn khi dùng nhiều, nhưng khỏi lo cập nhật hệ điều hành.

Không dùng GitHub Pages như nhánh cũ được, vì bản này cần API động chứ không chỉ tệp tĩnh.

### Bảo mật

Bảng đóng hàng chứa **tên và số điện thoại khách** — dữ liệu cá nhân. Trên máy quầy thì không sao vì máy đã đăng nhập, nhưng trên Host **bắt buộc phải đăng nhập** (FR-HO-05). Không được để URL công khai kiểu "link bí mật".

Trang trên Host là **chỉ đọc** (FR-HO-06): không tick đóng hàng, không sửa đơn từ xa. Cho ghi từ xa nghĩa là phải đồng bộ hai chiều, và đó là bài toán khác hẳn.

## Bốn quyết định về dữ liệu

**1. Khoá chính do máy quầy sinh.** `don_hang.id` là UUID v7 sinh ngay lúc mở đơn, bảng trên máy chủ **không có `DEFAULT gen_random_uuid()`**. Chính ID đó là idempotency key: gửi lại mười lần vẫn một đơn. Số hiển thị `POS01-20260909-0007` có tiền tố mã máy nên hai máy cùng offline vẫn không đụng số.

**2. Chi tiết đơn chụp lại tên và giá.** `chi_tiet_don_hang` lưu `loai_ca_ten`, `size_ca_ten`, `don_gia` dưới dạng snapshot, kèm `bang_gia_id` để truy vết. In lại phiếu sau hai năm vẫn ra đúng nội dung của ngày đó, kể cả khi bảng giá đã đổi mười lần.

**3. Hai trạng thái độc lập.** `trang_thai` (vòng đời đơn) và `trang_thai_dong` (đóng hàng) tách riêng. Nhồi cả hai vào một cột là cách chắc chắn nhất để sau này không diễn tả nổi "đơn đã xác nhận, đang đóng dở, chưa trả tiền".

**4. Hai mốc thời gian.** `dat_luc` (lúc khách đặt thật tại quầy) và `ghi_nhan_luc` (lúc máy chủ nhận được). Báo cáo theo ngày phải dùng `dat_luc`, nếu không đơn đặt lúc mất mạng sẽ nhảy sang ngày hôm sau.

## Đơn vị lưu trữ

| Loại | PostgreSQL | SQLite |
|---|---|---|
| Tiền | `numeric(18,2)` | `INTEGER` đồng VND |
| Khối lượng | `numeric(12,3)` kg | `INTEGER` gram |
| Thời điểm | `timestamptz` | `TEXT` ISO 8601 có offset |

SQLite không có kiểu `NUMERIC` thật. Quy đổi ở tầng đồng bộ. **Tuyệt đối không dùng `REAL` cho tiền hoặc khối lượng.**

## Đơn vị tính và số kg — giữ đúng project cũ

Project cũ (`TaoDonHang.jsx`) dùng `donvitinh.hesokg` để quy đổi: chọn đơn vị tính, nhập số lượng, số kg **tự tính** bằng `số lượng × hệ số`, và ô kg **bị khoá** khi hệ số > 0. Giá luôn tính theo **kg**, không theo đơn vị tính. Cơ chế này giữ nguyên.

Kéo theo ba con số trên mỗi dòng hàng, không được lẫn lộn:

| Cột | Nghĩa | Ví dụ |
|---|---|---|
| `so_luong` | Số lượng theo đơn vị tính | `5` thùng |
| `so_kg_du_kien` | `so_luong × he_so_kg`, tự tính lúc đặt | `125,000` kg |
| `so_kg_thuc_te` | Cân lại lúc đóng hàng, để trống nếu đúng | `123,400` kg |

Tiền tính trên `COALESCE(so_kg_thuc_te, so_kg_du_kien) × don_gia`.

Dòng hàng phải **chụp lại `he_so_kg`**: sửa "thùng" từ 25 kg thành 30 kg thì đơn cũ vẫn phải giữ 25, nếu không in lại phiếu năm ngoái sẽ ra số kg khác số đã giao.

## Thứ tự làm

1. Dựng monorepo, Tauri + SQLite, chạy `schema-client.sql`, seed dữ liệu mẫu
2. Màn hình đặt hàng — danh mục, nhóm giá, đơn vị tính, quy đổi kg, giá thủ công
3. Bảng đóng hàng (cửa sổ thứ hai) + tick dòng + nhập kg cân lại
4. Sửa đơn + lưu vết
5. Thống kê
6. In phiếu ESC/POS + VietQR sinh cục bộ
7. Host: VPS + Postgres + NestJS, chạy `schema-server.sql`
8. Vòng lặp outbox đẩy dữ liệu lên Host
9. Web chỉ đọc trên Host (`/dong-hang`, `/thong-ke`) dùng lại component bước 3 và 5

**Bước 1–6 đã là sản phẩm hoàn chỉnh dùng được ngay tại quầy**, hoàn toàn không cần Internet. Bước 7–9 chỉ thêm khả năng xem từ xa. Nếu muốn có cái chạy được sớm thì dừng ở bước 6 và dùng thử vài tuần trước khi đụng tới Host.
