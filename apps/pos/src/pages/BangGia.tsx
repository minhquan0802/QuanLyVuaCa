/**
 * Bảng giá — DAC-TA.md §5.2.
 *
 * Hai việc trên một màn hình:
 *   - Nhập giá hàng loạt cho cả ngày (FR-DM-07) + chép giá hôm qua (FR-DM-08)
 *   - Thêm / sửa / xoá nhóm giá (FR-NG-02, 03, 04)
 *
 * Giá cá đổi gần như hằng ngày nên thao tác nhập giá phải nhanh: một bảng
 * sản phẩm × nhóm giá, sửa hết rồi lưu một lần.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  dinhDangNgay,
  ngayHomNay,
  type Gia,
  type NhomGia,
  type SanPham,
} from '@vuaca/shared';
import { nguon } from '../data/index.js';
import type { OGia } from '../data/nguon.js';

type Tab = 'gia' | 'nhom';

export default function BangGia() {
  const [tab, setTab] = useState<Tab>('gia');
  return (
    <div className="p-3">
      <div className="mb-3 flex gap-2">
        {(
          [
            ['gia', 'Nhập giá'],
            ['nhom', 'Nhóm giá'],
          ] as const
        ).map(([k, nhan]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={[
              'h-12 rounded-xl border-2 px-5 text-base font-bold transition active:scale-[0.98]',
              tab === k
                ? 'border-cyan-600 bg-cyan-600 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
            ].join(' ')}
          >
            {nhan}
          </button>
        ))}
      </div>
      {tab === 'gia' ? <NhapGia /> : <QuanLyNhomGia />}
    </div>
  );
}

// ==========================================================================
// Nhập giá hàng loạt
// ==========================================================================

function NhapGia() {
  const [ngay, setNgay] = useState(() => ngayHomNay());
  const [nhomGia, setNhomGia] = useState<NhomGia[]>([]);
  const [sanPham, setSanPham] = useState<SanPham[]>([]);
  const [o, setO] = useState<Map<string, number>>(new Map());
  const [goc, setGoc] = useState<Map<string, number>>(new Map());
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const khoa = (spId: string, ngId: string) => `${spId}|${ngId}`;

  const nap = useCallback(async () => {
    const [ng, sp, gia] = await Promise.all([
      nguon.layNhomGia(),
      nguon.laySanPham(),
      nguon.layGiaNgay(ngay),
    ]);
    setNhomGia(ng);
    setSanPham(sp);
    const m = new Map(gia.map((g) => [khoa(g.sanPhamId, g.nhomGiaId), g.gia]));
    setO(m);
    setGoc(new Map(m));
    setThongBao(null);
    setLoi(null);
  }, [ngay]);

  useEffect(() => {
    void nap();
  }, [nap]);

  const daDoi = useMemo(() => {
    if (o.size !== goc.size) return true;
    for (const [k, v] of o) if (goc.get(k) !== v) return true;
    return false;
  }, [o, goc]);

  const soOTrong = useMemo(
    () => sanPham.length * nhomGia.length - [...o.values()].filter((v) => v > 0).length,
    [sanPham, nhomGia, o],
  );

  function dat(spId: string, ngId: string, chuoi: string) {
    const gia = Math.max(0, Math.round(Number(chuoi.replace(/\D/g, '')) || 0));
    setO((cu) => {
      const m = new Map(cu);
      if (gia > 0) m.set(khoa(spId, ngId), gia);
      else m.delete(khoa(spId, ngId));
      return m;
    });
  }

  async function chepHomQua() {
    const truoc = await nguon.layNgayCoGiaTruoc(ngay);
    if (!truoc) {
      setLoi('Không có bảng giá nào trước ngày này để chép.');
      return;
    }
    const gia: Gia[] = await nguon.layGiaNgay(truoc);
    setO(new Map(gia.map((g) => [khoa(g.sanPhamId, g.nhomGiaId), g.gia])));
    setThongBao(`Đã chép giá ngày ${dinhDangNgay(truoc)}. Sửa lại rồi bấm Lưu.`);
    setLoi(null);
  }

  async function luu() {
    const ds: OGia[] = [...o].map(([k, gia]) => {
      const [sanPhamId, nhomGiaId] = k.split('|') as [string, string];
      return { sanPhamId, nhomGiaId, gia };
    });
    try {
      await nguon.luuBangGia(ngay, ds);
      await nap();
      setThongBao(`Đã lưu bảng giá ngày ${dinhDangNgay(ngay)}.`);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={ngay}
          onChange={(e) => setNgay(e.target.value)}
          className="so h-12 rounded-xl border-2 border-slate-300 px-3 text-base"
        />
        <button
          onClick={() => void chepHomQua()}
          className="h-12 rounded-xl border-2 border-slate-300 bg-white px-4 font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98]"
        >
          Chép giá hôm qua
        </button>
        <button
          onClick={() => void luu()}
          disabled={!daDoi}
          className="h-12 rounded-xl bg-cyan-600 px-6 font-bold text-white hover:bg-cyan-700 disabled:bg-slate-300"
        >
          {daDoi ? 'Lưu bảng giá' : 'Chưa có thay đổi'}
        </button>
        {soOTrong > 0 && (
          <span className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">
            {soOTrong} ô chưa có giá — sản phẩm đó không thêm được vào đơn
          </span>
        )}
      </div>

      {thongBao && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 font-semibold text-emerald-800">
          {thongBao}
        </p>
      )}
      {loi && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 font-semibold text-rose-700">{loi}</p>
      )}

      <div className="overflow-x-auto rounded-xl border-2 border-slate-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
            <tr>
              <th className="px-3 py-3">Mặt hàng</th>
              {nhomGia.map((n) => (
                <th key={n.id} className="px-3 py-3 text-right">
                  {n.ten}
                  {n.laSi && <span className="ml-1 font-normal text-slate-400">(sỉ)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sanPham.map((sp, i) => (
              <tr
                key={sp.id}
                className={[
                  'border-t border-slate-200',
                  i > 0 && sanPham[i - 1]!.loaiCaId !== sp.loaiCaId
                    ? 'border-t-4 border-t-slate-300'
                    : '',
                ].join(' ')}
              >
                <td className="px-3 py-2 font-medium whitespace-nowrap">
                  {sp.loaiCaTen} — {sp.sizeCaTen}
                </td>
                {nhomGia.map((n) => {
                  const v = o.get(khoa(sp.id, n.id));
                  return (
                    <td key={n.id} className="px-3 py-2 text-right">
                      <input
                        value={v ?? ''}
                        onChange={(e) => dat(sp.id, n.id, e.target.value)}
                        placeholder="—"
                        inputMode="numeric"
                        aria-label={`Giá ${sp.loaiCaTen} ${sp.sizeCaTen} cho ${n.ten}`}
                        className={[
                          'so h-11 w-28 rounded-lg border-2 px-2 text-right font-bold',
                          v == null
                            ? 'border-amber-300 bg-amber-50'
                            : goc.get(khoa(sp.id, n.id)) !== v
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-900'
                              : 'border-slate-200',
                        ].join(' ')}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">
        Đơn giá là <b>giá mỗi kg</b>. Ô vàng là chưa có giá, ô xanh là vừa sửa chưa lưu. Ngày nào
        không nhập giá thì hệ thống dùng bảng giá của ngày gần nhất trước đó.
      </p>
    </div>
  );
}

// ==========================================================================
// Nhóm giá
// ==========================================================================

const RONG: Omit<NhomGia, 'id'> = { ma: '', ten: '', laSi: true, thuTu: 99, laMacDinh: false };

function QuanLyNhomGia() {
  const [ds, setDs] = useState<NhomGia[]>([]);
  const [khachTheoNhom, setKhachTheoNhom] = useState<Record<string, number>>({});
  const [moi, setMoi] = useState<Omit<NhomGia, 'id'>>({ ...RONG });
  const [loi, setLoi] = useState<string | null>(null);

  const nap = useCallback(async () => {
    const [ng, kh] = await Promise.all([nguon.layNhomGia(), nguon.layKhachHang()]);
    setDs(ng);
    const dem: Record<string, number> = {};
    for (const k of kh) dem[k.nhomGiaId] = (dem[k.nhomGiaId] ?? 0) + 1;
    setKhachTheoNhom(dem);
  }, []);

  useEffect(() => {
    void nap();
  }, [nap]);

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
    <div className="max-w-4xl space-y-3">
      {loi && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 font-semibold text-rose-700">{loi}</p>
      )}

      <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
            <tr>
              <th className="px-3 py-3">Mã</th>
              <th className="px-3 py-3">Tên hiển thị</th>
              <th className="px-3 py-3 text-center">Là nhóm sỉ</th>
              <th className="px-3 py-3 text-center">Mặc định</th>
              <th className="px-3 py-3 text-right">Số khách</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {ds.map((n) => (
              <tr key={n.id} className="border-t border-slate-200">
                <td className="px-3 py-2">
                  <input
                    defaultValue={n.ma}
                    onBlur={(e) => void chay(() => nguon.suaNhomGia(n.id, { ma: e.target.value }))}
                    className="so h-11 w-32 rounded-lg border-2 border-slate-200 px-2 font-bold"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    defaultValue={n.ten}
                    onBlur={(e) => void chay(() => nguon.suaNhomGia(n.id, { ten: e.target.value }))}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 px-2"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={n.laSi}
                    onChange={(e) => void chay(() => nguon.suaNhomGia(n.id, { laSi: e.target.checked }))}
                    aria-label="Là nhóm sỉ — đơn phải qua bước đóng hàng"
                    className="h-6 w-6 accent-cyan-600"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="radio"
                    name="mac-dinh"
                    checked={n.laMacDinh}
                    onChange={() => void chay(() => nguon.suaNhomGia(n.id, { laMacDinh: true }))}
                    aria-label="Nhóm giá mặc định cho khách vãng lai"
                    className="h-6 w-6 accent-cyan-600"
                  />
                </td>
                <td className="so px-3 py-2 text-right text-slate-500">
                  {khachTheoNhom[n.id] ?? 0}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => void chay(() => nguon.xoaNhomGia(n.id))}
                    disabled={n.laMacDinh}
                    className="h-11 rounded-lg bg-rose-50 px-4 font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-30"
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
        <h3 className="mb-3 text-sm font-bold text-slate-700">Thêm nhóm giá mới</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold text-slate-500">
            Mã
            <input
              value={moi.ma}
              onChange={(e) => setMoi({ ...moi, ma: e.target.value })}
              placeholder="SI_CHO_NOI"
              className="so mt-1 block h-12 w-40 rounded-lg border-2 border-slate-300 px-2 font-bold text-slate-900"
            />
          </label>
          <label className="text-xs font-bold text-slate-500">
            Tên hiển thị
            <input
              value={moi.ten}
              onChange={(e) => setMoi({ ...moi, ten: e.target.value })}
              placeholder="Sỉ chợ nổi"
              className="mt-1 block h-12 w-56 rounded-lg border-2 border-slate-300 px-2 text-slate-900"
            />
          </label>
          <label className="flex h-12 items-center gap-2 text-sm font-bold text-slate-600">
            <input
              type="checkbox"
              checked={moi.laSi}
              onChange={(e) => setMoi({ ...moi, laSi: e.target.checked })}
              className="h-6 w-6 accent-cyan-600"
            />
            Là nhóm sỉ
          </label>
          <button
            onClick={() =>
              void chay(async () => {
                await nguon.themNhomGia({ ...moi, thuTu: ds.length + 1 });
                setMoi({ ...RONG });
              })
            }
            disabled={!moi.ma.trim() || !moi.ten.trim()}
            className="h-12 rounded-xl bg-slate-900 px-6 font-bold text-white hover:bg-slate-800 disabled:bg-slate-300"
          >
            Thêm nhóm
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Nhóm mới chưa có giá cho sản phẩm nào — sang tab <b>Nhập giá</b> điền các ô còn trống.
          Cờ <b>là nhóm sỉ</b> quyết định đơn của khách nhóm này có phải qua bước đóng hàng hay
          không.
        </p>
      </div>

      <p className="text-xs text-slate-400">
        Không xoá được nhóm mặc định, và không xoá được nhóm còn khách đang thuộc về — phải chuyển
        họ sang nhóm khác trước. Đổi tên nhóm <b>không</b> làm đổi tên đã ghi trên các đơn cũ.
      </p>
    </div>
  );
}
