/**
 * Quy ước đơn vị lưu trữ — xem DAC-TA.md §8.
 *
 * Mọi con số tiền và khối lượng đều là SỐ NGUYÊN. Không bao giờ dùng số thực
 * dấu phẩy động cho tiền hoặc cân nặng: 0.1 + 0.2 !== 0.3 và sai số đó đi
 * thẳng vào hoá đơn của khách.
 *
 *   Tiền              -> đồng VND               1.234.500 ₫  ->  1234500
 *   Khối lượng        -> gram                   32,500 kg    ->  32500
 *   Số lượng theo ĐVT -> phần nghìn             5 thùng      ->  5000
 *   Hệ số quy đổi kg  -> phần nghìn             25 kg/thùng  ->  25000
 *   Đơn giá           -> đồng MỖI KG            32.500 ₫/kg  ->  32500
 */

/** Đồng VND. */
export type Dong = number;
/** Gram. */
export type Gram = number;
/** Phần nghìn — dùng cho số lượng theo đơn vị tính và hệ số quy đổi. */
export type PhanNghin = number;

export const NGHIN = 1000;

/** `5` thùng -> `5000` */
export const toPhanNghin = (v: number): PhanNghin => Math.round(v * NGHIN);
/** `5000` -> `5` */
export const tuPhanNghin = (v: PhanNghin): number => v / NGHIN;
/** `32.5` kg -> `32500` gram */
export const kgSangGram = (kg: number): Gram => Math.round(kg * NGHIN);
/** `32500` gram -> `32.5` kg */
export const gramSangKg = (g: Gram): number => g / NGHIN;

/**
 * Số kg dự kiến của một dòng hàng = số lượng × hệ số quy đổi.
 * Giữ đúng công thức của project cũ (`estimatedKg = quantity * factor`).
 *
 * Hệ số bằng 0 nghĩa là đơn vị tính không quy đổi được (FR-DH-07) — lúc đó
 * nhân viên nhập số kg bằng tay, hàm này trả về 0 để giao diện mở ô nhập.
 *
 *   5 thùng (5000) × 25 kg/thùng (25000) -> 125.000 gram = 125 kg
 */
export function tinhSoKgDuKien(soLuong: PhanNghin, heSoKg: PhanNghin): Gram {
  if (heSoKg <= 0) return 0;
  return Math.round((soLuong * heSoKg) / NGHIN);
}

/**
 * Thành tiền của một dòng = số kg × đơn giá mỗi kg.
 * Số kg dùng để tính là số cân lại nếu có, không thì lấy số dự kiến.
 */
export function tinhThanhTien(soKg: Gram, donGiaMoiKg: Dong): Dong {
  return Math.round((soKg * donGiaMoiKg) / NGHIN);
}

/** Số kg dùng để tính tiền: cân lại nếu có, không thì dự kiến. */
export function soKgTinhTien(soKgDuKien: Gram, soKgThucTe: Gram | null | undefined): Gram {
  return soKgThucTe != null && soKgThucTe > 0 ? soKgThucTe : soKgDuKien;
}
