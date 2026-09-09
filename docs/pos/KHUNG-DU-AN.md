# Khung dự án POS — trạng thái hiện tại

## Chạy thử

```bash
npm install                          # chỉ cần một lần

npm run tauri:dev                    # ỨNG DỤNG THẬT — dữ liệu lưu vào SQLite
npm run dev                          # chỉ giao diện trong trình duyệt, dữ liệu trong bộ nhớ

npm test                             # 41 bài kiểm thử logic nghiệp vụ
npm run typecheck
npm run tauri:build                  # đóng gói bản cài .exe
```

Tệp CSDL: `%APPDATA%\vn.vuaca.pos\pos.db`
**Đây là bản duy nhất trên đời của đơn chưa đồng bộ — phải sao lưu hằng ngày.**
Muốn xoá sạch làm lại: đóng app, xoá cả thư mục `vn.vuaca.pos`, mở lại.

## Cấu trúc

```
/
├── package.json          npm workspaces
├── tsconfig.base.json    strict + noUncheckedIndexedAccess
├── packages/shared/      logic nghiệp vụ thuần, dùng chung máy quầy và Host
│   └── src/
│       ├── don-vi.ts     quy đổi kg, tính tiền — số nguyên, không dấu phẩy động
│       ├── dinh-dang.ts  định dạng tiếng Việt, bỏ dấu để tìm kiếm
│       ├── kieu.ts       kiểu dữ liệu ánh xạ 1-1 với schema-client.sql
│       ├── ma-don.ts     UUID v7 + sinh mã đơn
│       └── vietqr.ts     sinh QR EMVCo cục bộ + CRC-16
└── apps/pos/             ứng dụng bán hàng
    └── src/
        ├── data/         ← lớp trừu tượng nguồn dữ liệu
        │   ├── nguon.ts  interface NguonDuLieu
        │   ├── bo-nho.ts cài đặt tạm trong bộ nhớ + dữ liệu mẫu
        │   └── index.ts  chọn nguồn — ĐỔI MỘT DÒNG ở đây khi có SQLite
        └── pages/
            ├── DatHang.tsx
            ├── ManHinhThanhToan.tsx
            ├── BangDongHang.tsx
            └── ThongKe.tsx
```

## Đã làm được

| Hạng mục | Trạng thái |
|---|---|
| Quy đổi đơn vị tính → kg, ô kg khoá khi hệ số > 0 | Xong, có kiểm thử |
| Tính tiền theo kg, toàn số nguyên | Xong, có kiểm thử |
| Sinh VietQR cục bộ (EMVCo + CRC-16) | Xong, có kiểm thử đối chiếu chuỗi thật |
| UUID v7 + mã đơn `POS-yyyyMMdd-nnnn` | Xong |
| Bảng đóng hàng: gộp ô, không mã đơn, tick, kg cân lại, cảnh báo chờ lâu | Xong |
| Đặt hàng: chọn khách, nhóm giá, cộng dồn dòng trùng, sửa giá tay | Xong |
| Thanh toán tiền mặt / QR, đơn chỉ ghi nhận sau khi xác nhận nhận tiền | Xong |
| Cảnh báo khách đang có đơn chưa hoàn tất (FR-SD-10) | Xong |
| Thống kê ngày | Xong |
| Giao diện cảm ứng: lưới nút, bàn phím số, mục bấm ≥ 56px | Xong |
| **Sửa đơn ở mọi trạng thái + bắt buộc lý do + lưu vết trước/sau** | Xong, có kiểm thử |
| Sửa đơn đã đóng thì dòng bị đổi quay lại chưa đóng (FR-SD-05) | Xong, có kiểm thử |
| Cảnh báo khách trả thiếu/thừa sau khi sửa (FR-SD-04) | Xong, có kiểm thử |
| Huỷ đơn có lý do, lưu vết | Xong |
| Thêm mặt hàng khi đang sửa đơn, cộng dồn dòng trùng | Xong, có kiểm thử |
| **Nhập giá hàng loạt theo ngày + chép giá hôm qua** | Xong |
| **Thêm / sửa / xoá nhóm giá**, chặn xoá nhóm còn khách | Xong |
| **Quản lý khách hàng**, chặn trùng số điện thoại, xoá mềm | Xong |
| Phím tắt F1–F4, F6, F7 chuyển màn hình | Xong |

| **Vỏ Tauri 2 + lưu thật xuống SQLite** | Xong |
| Migration tự chạy lần đầu, gieo danh mục mẫu | Xong |
| WAL + `synchronous = FULL` (PC-02) | Xong |
| Hàng đợi `outbox` ghi mỗi khi tạo hoặc sửa đơn | Xong |

## Chưa làm

| Hạng mục | Cần gì trước |
|---|---|
| Cửa sổ thứ hai cho bảng đóng hàng (FR-DG-03) | Không vướng gì |
| In phiếu ESC/POS | Không vướng gì |
| Quản lý loại cá / size / đơn vị tính | Không vướng gì, hiện đang cố định trong mã |
| Đăng nhập, phân quyền `QUAN_TRI` | Không vướng gì |
| Đơn treo (park sale) | Mẫu mượn từ POS thương mại, chưa có trong đặc tả |
| Host: NestJS + PostgreSQL + đồng bộ | Sau khi phần quầy chạy ổn |

## Bảng giá lưu theo ngày

Nguồn bộ nhớ mô phỏng đúng ngữ nghĩa `daterange` của Postgres: giá của một ngày
là bảng giá của **ngày gần nhất không muộn hơn nó**. Nhờ vậy không nhập giá hôm
nay thì vẫn dùng giá hôm qua — đúng như thực tế ở vựa, và khớp với ràng buộc
`EXCLUDE USING gist` trong `schema-server.sql`.

## Hai nguồn dữ liệu, một giao diện

`src/data/index.ts` chọn nguồn lúc khởi động:

| Chạy bằng | Nguồn | Dữ liệu |
|---|---|---|
| `npm run tauri:dev` | `NguonSQLite` | Lưu thật vào `pos.db` |
| `npm run dev` | `NguonBoNho` | Trong bộ nhớ, mất khi tải lại trang |

Không một dòng giao diện nào biết mình đang dùng nguồn nào — cả hai cài cùng
interface `NguonDuLieu`. Nguồn thứ ba (`NguonHTTP` cho web trên Host) sẽ cắm
vào đúng chỗ đó.

Danh mục mẫu nằm ở `src/data/du-lieu-mau.ts`, dùng chung cho cả hai nguồn nên
không bao giờ lệch nhau.

## Lược đồ SQLite có hai bản, phải sửa cả hai

| Tệp | Vai trò |
|---|---|
| `docs/pos/schema-client.sql` | Bản tài liệu, có kèm PRAGMA |
| `apps/pos/src-tauri/migrations/001_khoi_tao.sql` | Bản chạy thật, bỏ PRAGMA |

Migration của sqlx chạy trong một transaction, mà `PRAGMA journal_mode` không
đổi được bên trong transaction — nên PRAGMA được đặt lúc mở kết nối ở
`NguonSQLite.khoiTao()`.

Sửa lược đồ thì **sửa cả hai tệp**, hoặc thêm migration `002_*.sql` mới.

## Dùng `npm workspaces` thay cho `pnpm`

Máy chưa có pnpm, mà npm thì có sẵn theo Node 22. Với dự án cỡ này npm
workspaces đủ dùng, và bớt được một thứ phải cài.
