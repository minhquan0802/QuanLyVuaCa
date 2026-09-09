/** Quản lý khách hàng — DAC-TA.md §5.1. */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { boDau, type KhachHang, type NhomGia } from '@vuaca/shared';
import { nguon } from '../data/index.js';

const RONG: Omit<KhachHang, 'id'> = {
  ma: null,
  hoTen: '',
  soDienThoai: null,
  diaChi: null,
  nhomGiaId: '',
  ghiChu: null,
};

export default function TrangKhachHang() {
  const [ds, setDs] = useState<KhachHang[]>([]);
  const [nhomGia, setNhomGia] = useState<NhomGia[]>([]);
  const [tim, setTim] = useState('');
  const [moi, setMoi] = useState<Omit<KhachHang, 'id'>>({ ...RONG });
  const [loi, setLoi] = useState<string | null>(null);

  const nap = useCallback(async () => {
    const [kh, ng] = await Promise.all([nguon.layKhachHang(), nguon.layNhomGia()]);
    setDs(kh);
    setNhomGia(ng);
    setMoi((m) => (m.nhomGiaId ? m : { ...m, nhomGiaId: ng.find((n) => n.laMacDinh)?.id ?? '' }));
  }, []);

  useEffect(() => {
    void nap();
  }, [nap]);

  const ketQua = useMemo(() => {
    const q = boDau(tim);
    if (!q) return ds;
    return ds.filter((k) => boDau(k.hoTen).includes(q) || (k.soDienThoai ?? '').includes(q));
  }, [ds, tim]);

  async function chay(fn: () => Promise<unknown>) {
    try {
      await fn();
      setLoi(null);
      await nap();
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-3 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={tim}
          onChange={(e) => setTim(e.target.value)}
          placeholder="Tìm theo tên hoặc số điện thoại — gõ không dấu cũng ra"
          className="h-12 w-96 rounded-xl border-2 border-slate-300 px-3 focus:border-cyan-600 focus:outline-none"
        />
        <span className="text-sm font-semibold text-slate-500">{ketQua.length} khách</span>
      </div>

      {loi && <p className="rounded-xl bg-rose-50 px-4 py-3 font-semibold text-rose-700">{loi}</p>}

      <div className="overflow-x-auto rounded-xl border-2 border-slate-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
            <tr>
              <th className="px-3 py-3">Tên khách</th>
              <th className="px-3 py-3">Số điện thoại</th>
              <th className="px-3 py-3">Địa chỉ</th>
              <th className="px-3 py-3">Nhóm giá</th>
              <th className="px-3 py-3">Ghi chú</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {ketQua.map((k) => (
              <tr key={k.id} className="border-t border-slate-200">
                <td className="px-3 py-2">
                  <input
                    defaultValue={k.hoTen}
                    onBlur={(e) => void chay(() => nguon.suaKhachHang(k.id, { hoTen: e.target.value }))}
                    className="h-11 w-44 rounded-lg border-2 border-slate-200 px-2 font-bold"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    defaultValue={k.soDienThoai ?? ''}
                    onBlur={(e) =>
                      void chay(() =>
                        nguon.suaKhachHang(k.id, { soDienThoai: e.target.value.trim() || null }),
                      )
                    }
                    className="so h-11 w-36 rounded-lg border-2 border-slate-200 px-2"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    defaultValue={k.diaChi ?? ''}
                    onBlur={(e) =>
                      void chay(() => nguon.suaKhachHang(k.id, { diaChi: e.target.value.trim() || null }))
                    }
                    className="h-11 w-48 rounded-lg border-2 border-slate-200 px-2"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={k.nhomGiaId}
                    onChange={(e) => void chay(() => nguon.suaKhachHang(k.id, { nhomGiaId: e.target.value }))}
                    className="h-11 rounded-lg border-2 border-slate-200 px-2 font-semibold"
                  >
                    {nhomGia.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.ten}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    defaultValue={k.ghiChu ?? ''}
                    onBlur={(e) =>
                      void chay(() => nguon.suaKhachHang(k.id, { ghiChu: e.target.value.trim() || null }))
                    }
                    className="h-11 w-52 rounded-lg border-2 border-slate-200 px-2"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => void chay(() => nguon.xoaKhachHang(k.id))}
                    className="h-11 rounded-lg bg-rose-50 px-4 font-bold text-rose-600 hover:bg-rose-100"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border-2 border-slate-300 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-700">Thêm khách hàng mới</h3>
        <div className="flex flex-wrap items-end gap-3">
          <O nhan="Tên khách" rong="w-44">
            <input
              value={moi.hoTen}
              onChange={(e) => setMoi({ ...moi, hoTen: e.target.value })}
              placeholder="Chị Tư"
              className="h-12 w-44 rounded-lg border-2 border-slate-300 px-2 font-bold"
            />
          </O>
          <O nhan="Số điện thoại" rong="w-36">
            <input
              value={moi.soDienThoai ?? ''}
              onChange={(e) => setMoi({ ...moi, soDienThoai: e.target.value.trim() || null })}
              inputMode="numeric"
              className="so h-12 w-36 rounded-lg border-2 border-slate-300 px-2"
            />
          </O>
          <O nhan="Địa chỉ" rong="w-48">
            <input
              value={moi.diaChi ?? ''}
              onChange={(e) => setMoi({ ...moi, diaChi: e.target.value.trim() || null })}
              className="h-12 w-48 rounded-lg border-2 border-slate-300 px-2"
            />
          </O>
          <O nhan="Nhóm giá" rong="">
            <select
              value={moi.nhomGiaId}
              onChange={(e) => setMoi({ ...moi, nhomGiaId: e.target.value })}
              className="h-12 rounded-lg border-2 border-slate-300 px-2 font-semibold"
            >
              {nhomGia.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.ten}
                </option>
              ))}
            </select>
          </O>
          <button
            onClick={() =>
              void chay(async () => {
                await nguon.themKhachHang(moi);
                setMoi({ ...RONG, nhomGiaId: moi.nhomGiaId });
              })
            }
            disabled={!moi.hoTen.trim() || !moi.nhomGiaId}
            className="h-12 rounded-xl bg-slate-900 px-6 font-bold text-white hover:bg-slate-800 disabled:bg-slate-300"
          >
            Thêm khách
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Xoá khách là <b>xoá mềm</b> — các đơn cũ vẫn giữ nguyên tên và số điện thoại đã chụp lại
        lúc đặt hàng. Số điện thoại không được trùng giữa các khách.
      </p>
    </div>
  );
}

function O({ nhan, rong, children }: { nhan: string; rong: string; children: React.ReactNode }) {
  return (
    <label className={`text-xs font-bold text-slate-500 ${rong}`}>
      {nhan}
      <div className="mt-1">{children}</div>
    </label>
  );
}
