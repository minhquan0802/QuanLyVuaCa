# Hướng dẫn tích hợp TanStack Query (Cache cho Admin)

## Vấn đề hiện tại

Mỗi trang admin dùng pattern `useEffect + api.get()`. Khi admin chuyển qua lại giữa các tab
(Đơn hàng → Kho → Công nợ → quay lại Đơn hàng), mỗi lần navigate là component remount
và gọi API lại từ đầu — dù data không hề thay đổi.

## Giải pháp: TanStack Query

TanStack Query lưu kết quả API vào RAM (JS heap của browser tab) theo `queryKey`.
Khi chuyển tab quay lại, nếu data còn trong thời gian `staleTime`, không gọi API nữa.

---

## Bước 1 — Cài package

```bash
npm install @tanstack/react-query
```

---

## Bước 2 — Wrap app trong `main.jsx`

Thêm `QueryClientProvider` bao ngoài toàn bộ app. Chỉ làm **1 lần duy nhất**.

```jsx
// client/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // thêm
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient(); // thêm

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>  {/* thêm wrapper */}
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

---

## Bước 3 — Đổi từng trang admin

### Ví dụ: `QuanLyDonHang.jsx`

**TRƯỚC (code hiện tại):**

```jsx
import React, { useState, useEffect, useMemo } from "react";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function QuanLyDonHang() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        api.get("/Donhangs")
            .then(res => {
                let realData = res.data.result || [];
                realData.sort((a, b) => {
                    const pa = STATUS_PRIORITY[a.trangthaidonhang] || 99;
                    const pb = STATUS_PRIORITY[b.trangthaidonhang] || 99;
                    if (pa !== pb) return pa - pb;
                    return new Date(b.ngaydat) - new Date(a.ngaydat);
                });
                setOrders(realData);
            })
            .catch(() => showToast("Không thể tải danh sách đơn hàng!", "error"))
            .finally(() => setLoading(false));
    }, []);

    const filteredOrders = useMemo(() => ...);
    // ... JSX giữ nguyên
}
```

**SAU (dùng TanStack Query):**

```jsx
import React, { useMemo } from "react";           // bỏ useState, useEffect
import { useQuery } from "@tanstack/react-query";  // thêm
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function QuanLyDonHang() {
    const { showToast } = useToast();

    const { data: orders = [], isLoading: loading } = useQuery({
        queryKey: ["don-hang"],           // tên cache — phải unique trong toàn app
        queryFn: () =>
            api.get("/Donhangs").then(res => {
                let realData = res.data.result || [];
                realData.sort((a, b) => {
                    const pa = STATUS_PRIORITY[a.trangthaidonhang] || 99;
                    const pb = STATUS_PRIORITY[b.trangthaidonhang] || 99;
                    if (pa !== pb) return pa - pb;
                    return new Date(b.ngaydat) - new Date(a.ngaydat);
                });
                return realData;
            }),
        staleTime: 30_000,   // 30 giây — trong khoảng này không gọi API dù chuyển tab
        onError: () => showToast("Không thể tải danh sách đơn hàng!", "error"),
    });

    const filteredOrders = useMemo(() => ...);
    // ... JSX giữ nguyên hoàn toàn, không đổi gì
}
```

**Thay đổi duy nhất:** xóa `useState` + `useEffect` + `setLoading`, thay bằng 1 block `useQuery`.
Phần JSX render bên dưới **không cần đổi gì**.

---

## Bảng staleTime theo từng trang

| Trang | queryKey | staleTime gợi ý | Lý do |
|---|---|---|---|
| QuanLyDonHang | `["don-hang"]` | `30_000` (30s) | Thay đổi thường xuyên |
| QuanLyKho | `["kho-hang"]` | `60_000` (1 phút) | Thay đổi khi có đơn mới |
| QuanLyCongNo | `["cong-no"]` | `60_000` (1 phút) | Thay đổi khi có đơn mới |
| QuanLyThanhLy | `["thanh-ly"]` | `60_000` (1 phút) | - |
| QuanLyLoaiCa | `["loai-ca"]` | `300_000` (5 phút) | Ít thay đổi |
| QuanLyBangGia | `["bang-gia"]` | `300_000` (5 phút) | Ít thay đổi |
| QuanLyTaiKhoan | `["tai-khoan"]` | `300_000` (5 phút) | Ít thay đổi |

---

## Bước 4 — Invalidate cache sau khi mutation

Khi admin tạo/sửa/xóa data, cần báo cho cache biết để refetch.

```jsx
import { useQueryClient } from "@tanstack/react-query";

export default function TaoDonHang() {
    const queryClient = useQueryClient();

    const handleSubmit = async () => {
        await api.post("/Donhangs", formData);

        // Xóa cache "don-hang" → lần navigate tiếp theo sẽ fetch lại
        queryClient.invalidateQueries({ queryKey: ["don-hang"] });
        queryClient.invalidateQueries({ queryKey: ["kho-hang"] }); // kho cũng thay đổi
    };
}
```

---

## Bước 5 — Kết hợp với SSE (tuỳ chọn, nâng cao)

SSE hiện tại (`AdminLayout.jsx`) chỉ nhận thông báo. Có thể mở rộng để invalidate cache
khi có sự kiện liên quan:

```jsx
// AdminLayout.jsx
import { useQueryClient } from "@tanstack/react-query";

// trong component:
const queryClient = useQueryClient();

eventSource.addEventListener("thongbao", (e) => {
    const thongBaoMoi = JSON.parse(e.data);
    setThongBaoList(prev => [thongBaoMoi, ...prev]);
    setSoChuaXem(prev => prev + 1);

    // Nếu thông báo liên quan đến đơn hàng thì invalidate luôn
    if (thongBaoMoi.loai === "DON_HANG_MOI" || thongBaoMoi.loai === "CAP_NHAT_DON") {
        queryClient.invalidateQueries({ queryKey: ["don-hang"] });
    }
    if (thongBaoMoi.loai === "LO_QUA_HAN") {
        queryClient.invalidateQueries({ queryKey: ["kho-hang"] });
    }
});
```

---

## So sánh hành vi

| Tình huống | Trước | Sau |
|---|---|---|
| Vào tab lần đầu | Gọi API | Gọi API (cache miss) |
| Chuyển tab rồi quay lại (trong staleTime) | Gọi API lại | **Không gọi — lấy từ RAM** |
| Quay lại sau staleTime | Gọi API lại | Gọi API lại (tự động) |
| Admin tạo/sửa/xóa | Không tự cập nhật | `invalidateQueries` → refetch |
| F5 hoặc đóng tab | - | Cache mất, gọi lại từ đầu |

---

## Tóm tắt thay đổi mỗi trang

1. Xóa `useState` cho data và loading
2. Xóa `useEffect`
3. Thêm `useQuery` với `queryKey` và `staleTime` phù hợp
4. Phần JSX giữ nguyên hoàn toàn
5. Chỗ nào có mutation (POST/PUT/DELETE) thì thêm `invalidateQueries`
