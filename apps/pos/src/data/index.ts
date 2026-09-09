/**
 * Chọn nguồn dữ liệu cho toàn ứng dụng.
 *
 *   Chạy trong Tauri  -> NguonSQLite, dữ liệu lưu thật vào pos.db
 *   Chạy trong trình duyệt (npm run dev) -> NguonBoNho, mất khi tải lại trang
 *
 * Giao diện không biết mình đang dùng nguồn nào. Đây chính là lý do tầng
 * `NguonDuLieu` tồn tại.
 */

import { NguonBoNho } from './bo-nho.js';
import { NguonSQLite } from './sqlite.js';
import type { NguonDuLieu } from './nguon.js';

/** Tauri v2 gắn `__TAURI_INTERNALS__` vào window khi chạy trong app desktop. */
export const trongTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

let _nguon: NguonDuLieu = new NguonBoNho();

/** Gọi một lần lúc khởi động, trước khi vẽ giao diện. */
export async function moNguonDuLieu(): Promise<void> {
  if (!trongTauri()) return;
  const sqlite = new NguonSQLite();
  await sqlite.khoiTao();
  _nguon = sqlite;
}

/**
 * Proxy mỏng để các trang cứ `import { nguon }` như cũ mà vẫn nhận đúng
 * nguồn sau khi `moNguonDuLieu()` chạy xong.
 */
export const nguon: NguonDuLieu = new Proxy({} as NguonDuLieu, {
  get(_t, khoa: string) {
    const ham = (_nguon as unknown as Record<string, unknown>)[khoa];
    return typeof ham === 'function' ? ham.bind(_nguon) : ham;
  },
});

export type { NguonDuLieu };
