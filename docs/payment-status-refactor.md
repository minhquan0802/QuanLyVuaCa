# Cân nhắc: Tách trạng thái thanh toán ra khỏi trạng thái đơn hàng

## Vấn đề hiện tại

`trangthaidonhang` đang đảm nhiệm **2 chiều độc lập**:

- **Vòng đời đơn hàng**: CHO_XAC_NHAN → DANG_DONG_HANG → DANG_VAN_CHUYEN → GIAO_HANG_THANH_CONG
- **Trạng thái thanh toán**: chưa trả / đã trả

Sự gộp chung này gây ra bug double-counting trong credit check: `DA_THANH_TOAN` vừa được tính trong `congnohientai` (tăng khi giao, giảm khi trả), vừa bị đếm lại trong `tongTienDonDangXuLy` → phải thêm `HOAN_TAT` như workaround.

---

## Giải pháp đề xuất

Thêm cột `trangthaithanhtoan` vào bảng `donhang`:

```sql
ALTER TABLE donhang
ADD COLUMN trangthaithanhtoan ENUM('CHUA_THANH_TOAN', 'DA_THANH_TOAN')
    NOT NULL DEFAULT 'CHUA_THANH_TOAN';

-- Migrate data hiện có
UPDATE donhang SET trangthaithanhtoan = 'DA_THANH_TOAN'
WHERE trangthaidonhang IN ('DA_THANH_TOAN', 'HOAN_TAT');
```

Schema sau khi tách:

```
donhang
├── trangthaidonhang:      CHO_XAC_NHAN | DANG_DONG_HANG | DANG_VAN_CHUYEN | GIAO_HANG_THANH_CONG | HUY
└── trangthaithanhtoan:    CHUA_THANH_TOAN | DA_THANH_TOAN
```

---

## Thay đổi cần thực hiện

### Backend

1. **Enum mới** `TrangThaiThanhToanDonHang.java`:
   ```java
   public enum TrangThaiThanhToanDonHang {
       CHUA_THANH_TOAN,
       DA_THANH_TOAN
   }
   ```

2. **Entity `Donhang.java`**: thêm field mới, xóa `HOAN_TAT` khỏi `TrangThaiDonHang`

3. **`ThanhtoanService.xacNhanThanhToan`** — đơn giản hơn, không cần rẽ nhánh:
   ```java
   // Hiện tại (phức tạp):
   if (trangThai == GIAO_HANG_THANH_CONG) → HOAN_TAT
   else if (trangThai == CHO_XAC_NHAN) → DA_THANH_TOAN

   // Sau khi tách (rõ ràng):
   donhang.setTrangthaithanhtoan(TrangThaiThanhToanDonHang.DA_THANH_TOAN);
   ```

4. **`CongNoService.xuLyDonGiaoThanhCong`** — bỏ logic set HOAN_TAT cho SO_DU

5. **`CongNoService.tongTienDonDangXuLy`** — không đổi nhiều, vẫn filter theo order status

### Frontend

- Tab **"Đã giao"** = `GIAO_HANG_THANH_CONG` (bất kể đã trả chưa)
- Tab **"Hoàn tất"** = `GIAO_HANG_THANH_CONG` + `trangthaithanhtoan = DA_THANH_TOAN`
- Nút **"Thanh toán"** hiện khi `GIAO_HANG_THANH_CONG` + `CHUA_THANH_TOAN`

### Xóa workaround

- Xóa `HOAN_TAT` khỏi `TrangThaiDonHang` enum
- Xóa comment giải thích lý do loại `DA_THANH_TOAN` khỏi `tongTienDonDangXuLy`
- `QuanLyDonHang.jsx` và `ChiTietDonHang.jsx`: xóa entry `HOAN_TAT` khỏi ORDER_STATUS

---

## Đánh giá

| Tiêu chí | Có tách | Không tách (hiện tại) |
|---|---|---|
| `TrangThaiDonHang` enum | 5 giá trị rõ ràng | 7 giá trị có workaround |
| `xacNhanThanhToan` | đơn giản | có if/else phức tạp |
| `tongTienDonDangXuLy` | như nhau | như nhau |
| Admin có thể thấy 2 chiều | ✓ | ✗ |
| Công sức | ~3-4 giờ | — |

**Kết luận**: Nên làm nếu còn thời gian — design đúng hơn, code dễ đọc hơn, và loại bỏ được workaround `HOAN_TAT`. Logic credit check không thay đổi nhiều.
