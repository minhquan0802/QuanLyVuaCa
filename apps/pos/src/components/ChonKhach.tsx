/**
 * Bảng chọn khách hàng — nút to, bấm ngón tay được.
 * Danh sách khách hiện luôn ở dạng thẻ, không phải gõ mới thấy.
 */

import { useMemo, useState } from 'react';
import { boDau, type KhachHang, type NhomGia } from '@vuaca/shared';
import BanPhimSo from './BanPhimSo.js';

interface Props {
  khachList: KhachHang[];
  nhomGia: NhomGia[];
  onChon: (k: KhachHang | null) => void;
  onDong: () => void;
}

export default function ChonKhach({ khachList, nhomGia, onChon, onDong }: Props) {
  const [tim, setTim] = useState('');

  const ketQua = useMemo(() => {
    const q = boDau(tim);
    if (!q) return khachList;
    return khachList.filter(
      (k) => boDau(k.hoTen).includes(q) || (k.soDienThoai ?? '').includes(q),
    );
  }, [tim, khachList]);

  const tenNhom = (id: string) => nhomGia.find((n) => n.id === id)?.ten ?? '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-full w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-bold text-slate-900">Chọn khách hàng</h2>
          <button
            onClick={onDong}
            className="h-12 rounded-xl bg-slate-100 px-5 text-base font-bold text-slate-600 hover:bg-slate-200"
          >
            Đóng
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 p-5 md:grid-cols-[1fr_280px]">
          <div className="min-h-0 overflow-auto">
            <button
              onClick={() => onChon(null)}
              className="mb-3 h-16 w-full rounded-xl border-2 border-dashed border-slate-300 text-lg font-bold text-slate-500 hover:bg-slate-50 active:scale-[0.99]"
            >
              Khách vãng lai — không lưu hồ sơ
            </button>

            <div className="grid gap-2 sm:grid-cols-2">
              {ketQua.map((k) => (
                <button
                  key={k.id}
                  onClick={() => onChon(k)}
                  className="rounded-xl border border-slate-300 bg-white p-3 text-left transition hover:border-cyan-500 hover:bg-cyan-50 active:scale-[0.98]"
                >
                  <div className="text-lg font-bold text-slate-900">{k.hoTen}</div>
                  <div className="so text-sm text-slate-500">{k.soDienThoai}</div>
                  <div className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {tenNhom(k.nhomGiaId)}
                  </div>
                </button>
              ))}
              {ketQua.length === 0 && (
                <p className="col-span-full py-8 text-center text-slate-400">
                  Không tìm thấy khách nào.
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <input
              value={tim}
              onChange={(e) => setTim(e.target.value)}
              placeholder="Tên hoặc số điện thoại"
              className="mb-3 h-14 w-full rounded-xl border border-slate-300 px-4 text-lg focus:border-cyan-600 focus:outline-none"
            />
            <BanPhimSo giaTri={tim} onDoi={setTim} />
          </div>
        </div>
      </div>
    </div>
  );
}
