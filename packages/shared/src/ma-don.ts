/**
 * Sinh mã đơn và khoá chính — FR-DH-13.
 *
 * Khoá chính là UUID sinh NGAY tại máy quầy, không hỏi máy chủ. Chính nó là
 * idempotency key khi đồng bộ: gửi lại mười lần vẫn chỉ ra một đơn.
 *
 * Mã hiển thị cho người là `POS-20260909-0007`, có tiền tố theo nguồn nên đơn
 * tạo tại quầy và đơn tạo trên Host (tính năng sau này) không bao giờ đụng số.
 */

import type { NguonDon } from './kieu.js';

/**
 * UUID v7 — 48 bit đầu là mốc thời gian, nên khoá chính tự sắp theo thứ tự
 * tạo. Quan trọng với cả SQLite lẫn Postgres: chèn tuần tự không làm phân
 * mảnh chỉ mục như UUID v4 ngẫu nhiên.
 */
export function uuidV7(bayGio: number = Date.now()): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);

  // 48 bit mốc thời gian, big-endian
  b[0] = (bayGio / 2 ** 40) & 0xff;
  b[1] = (bayGio / 2 ** 32) & 0xff;
  b[2] = (bayGio / 2 ** 24) & 0xff;
  b[3] = (bayGio / 2 ** 16) & 0xff;
  b[4] = (bayGio / 2 ** 8) & 0xff;
  b[5] = bayGio & 0xff;

  b[6] = (b[6]! & 0x0f) | 0x70; // phiên bản 7
  b[8] = (b[8]! & 0x3f) | 0x80; // biến thể RFC 4122

  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** `new Date(...)` -> `"20260909"` theo giờ địa phương của máy quầy. */
export function nenNgay(ngay: string): string {
  return ngay.replaceAll('-', '');
}

/** Ngày làm việc hiện tại của vựa, `YYYY-MM-DD` theo giờ địa phương. */
export function ngayHomNay(bayGio: Date = new Date()): string {
  const y = bayGio.getFullYear();
  const m = String(bayGio.getMonth() + 1).padStart(2, '0');
  const d = String(bayGio.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `taoMaDon('POS', '2026-09-09', 7)` -> `'POS-20260909-0007'` */
export function taoMaDon(nguon: NguonDon, ngayBan: string, soThuTu: number): string {
  return `${nguon}-${nenNgay(ngayBan)}-${String(soThuTu).padStart(4, '0')}`;
}
