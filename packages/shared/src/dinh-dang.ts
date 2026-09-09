/** Định dạng hiển thị tiếng Việt — DAC-TA PC-03. */

import { gramSangKg, tuPhanNghin, type Dong, type Gram, type PhanNghin } from './don-vi.js';

const soVN = new Intl.NumberFormat('vi-VN');

const soVN3 = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const soVNGon = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 3,
});

/** `1234500` -> `"1.234.500 ₫"` */
export const dinhDangTien = (v: Dong): string => `${soVN.format(v)} ₫`;

/** `1234500` -> `"1.234.500"` — dùng khi ô đã có nhãn đơn vị riêng. */
export const dinhDangSo = (v: Dong): string => soVN.format(v);

/** `32500` -> `"32,500 kg"` — luôn đủ 3 chữ số thập phân cho dễ so hàng. */
export const dinhDangKg = (v: Gram): string => `${soVN3.format(gramSangKg(v))} kg`;

/** `5000` -> `"5"`, `2500` -> `"2,5"` — số lượng theo đơn vị tính. */
export const dinhDangSoLuong = (v: PhanNghin): string => soVNGon.format(tuPhanNghin(v));

/** `"2026-09-09T08:42:15+07:00"` -> `"08:42"` */
export function dinhDangGio(isoTime: string): string {
  const d = new Date(isoTime);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** `"2026-09-09"` -> `"09/09/2026"` */
export function dinhDangNgay(ngay: string): string {
  const [y, m, d] = ngay.split('-');
  return `${d}/${m}/${y}`;
}

/** Đã chờ bao lâu, tính từ lúc đặt tới bây giờ. `"chờ 12 phút"` */
export function dinhDangDaCho(isoTime: string, bayGio: Date = new Date()): string {
  const phut = Math.max(0, Math.floor((bayGio.getTime() - new Date(isoTime).getTime()) / 60_000));
  if (phut < 60) return `chờ ${phut} phút`;
  const gio = Math.floor(phut / 60);
  const du = phut % 60;
  return du === 0 ? `chờ ${gio} giờ` : `chờ ${gio} giờ ${du} phút`;
}

/**
 * Bỏ dấu tiếng Việt, chuyển chữ thường — dùng để tìm khách hàng (FR-KH-05).
 * Gõ `hung` phải ra `Hưng`.
 */
export function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}
