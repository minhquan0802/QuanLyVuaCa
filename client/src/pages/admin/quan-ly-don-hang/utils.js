import { STATUS_PRIORITY } from "./constants";

export const sapXepDonHang = (orders) =>
  [...(orders || [])].sort((a, b) => {
    const pa = STATUS_PRIORITY[a.trangthaidonhang] || 99;
    const pb = STATUS_PRIORITY[b.trangthaidonhang] || 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.ngaydat) - new Date(a.ngaydat);
  });

export const locDonHangTheoTrangThai = (orders, filterStatus) =>
  filterStatus === "ALL"
    ? orders
    : orders.filter((o) => o.trangthaidonhang === filterStatus);
