/**
 * Danh sách đơn hàng và sửa đơn — DAC-TA.md §5.4 và §5.7.
 *
 * Đơn sửa được ở BẤT KỲ trạng thái nào (FR-SD-01), đổi lại mỗi lần sửa bắt
 * buộc nhập lý do và hệ thống lưu bản chụp trước/sau (FR-SD-03).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  chenhLechThanhToan,
  dinhDangGio,
  dinhDangKg,
  dinhDangTien,
  gopDongHang,
  gramSangKg,
  kgSangGram,
  ngayHomNay,
  tinhLaiDong,
  tinhLaiTongDon,
  tinhSoKgDuKien,
  toPhanNghin,
  tuPhanNghin,
  type BanGhiSuaDon,
  type ChiTietDonHang,
  type DonHangDayDu,
} from '@vuaca/shared';
import { nguon } from '../data/index.js';
import ThemMatHang from '../components/ThemMatHang.js';

const NHAN_TRANG_THAI: Record<string, string> = {
  NHAP: 'Nháp',
  DA_XAC_NHAN: 'Đã xác nhận',
  HOAN_TAT: 'Hoàn tất',
  DA_HUY: 'Đã huỷ',
};

const NHAN_DONG: Record<string, string> = {
  KHONG_CAN: '—',
  CHO_DONG: 'Chờ đóng',
  DANG_DONG: 'Đang đóng',
  DA_DONG: 'Đã đóng',
};

export default function DonHang() {
  const [ngay, setNgay] = useState(() => ngayHomNay());
  const [danhSach, setDanhSach] = useState<DonHangDayDu[]>([]);
  const [chonId, setChonId] = useState<string | null>(null);

  const [nhap, setNhap] = useState<ChiTietDonHang[] | null>(null);
  const [lyDo, setLyDo] = useState('');
  const [lichSu, setLichSu] = useState<BanGhiSuaDon[]>([]);
  const [loi, setLoi] = useState<string | null>(null);
  const [moThemHang, setMoThemHang] = useState(false);

  const nap = useCallback(async () => {
    setDanhSach(await nguon.layDonTheoNgay(ngay));
  }, [ngay]);

  useEffect(() => {
    void nap();
  }, [nap]);

  const don = useMemo(() => danhSach.find((d) => d.id === chonId) ?? null, [danhSach, chonId]);

  useEffect(() => {
    if (!don) {
      setNhap(null);
      setLichSu([]);
      return;
    }
    setNhap(structuredClone(don.chiTiet));
    setLyDo('');
    setLoi(null);
    void nguon.layLichSuSuaDon(don.id).then(setLichSu);
  }, [don]);

  const daDoi = useMemo(() => {
    if (!don || !nhap) return false;
    return JSON.stringify(don.chiTiet) !== JSON.stringify(nhap);
  }, [don, nhap]);

  const tongNhap = nhap ? tinhLaiTongDon(nhap) : null;

  function doiDong(id: string, sua: (c: ChiTietDonHang) => ChiTietDonHang) {
    setNhap((cu) => (cu ? cu.map((c) => (c.id === id ? tinhLaiDong(sua(c)) : c)) : cu));
  }

  function doiSoLuong(c: ChiTietDonHang, chuoi: string) {
    const v = Number(chuoi.replace(',', '.')) || 0;
    if (v <= 0) return;
    const soLuong = toPhanNghin(v);
    doiDong(c.id, (x) => ({
      ...x,
      soLuong,
      // Hệ số > 0 thì kg tự tính lại; hệ số 0 thì kg do người nhập, giữ nguyên
      soKgDuKien: x.heSoKg > 0 ? tinhSoKgDuKien(soLuong, x.heSoKg) : x.soKgDuKien,
    }));
  }

  function doiKg(c: ChiTietDonHang, chuoi: string) {
    const v = Number(chuoi.replace(',', '.')) || 0;
    if (v <= 0) return;
    doiDong(c.id, (x) => ({ ...x, soKgDuKien: kgSangGram(v) }));
  }

  function doiGia(c: ChiTietDonHang, chuoi: string) {
    const gia = Math.max(0, Math.round(Number(chuoi.replace(/\D/g, '')) || 0));
    doiDong(c.id, (x) => ({ ...x, donGia: gia, giaSuaTay: true }));
  }

  async function luu() {
    if (!don || !nhap) return;
    try {
      await nguon.suaDon(don.id, nhap, lyDo);
      setLoi(null);
      setLyDo('');
      await nap();
      setLichSu(await nguon.layLichSuSuaDon(don.id));
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    }
  }

  async function huy() {
    if (!don) return;
    try {
      await nguon.huyDon(don.id, lyDo);
      setLoi(null);
      setLyDo('');
      await nap();
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="grid h-full gap-3 p-3 xl:grid-cols-[420px_1fr]">
      {/* ------------------------------------------------------ danh sách */}
      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={ngay}
            onChange={(e) => setNgay(e.target.value)}
            className="so h-12 rounded-xl border-2 border-slate-300 px-3 text-base"
          />
          <span className="text-sm font-semibold text-slate-500">{danhSach.length} đơn</span>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-auto">
          {danhSach.length === 0 && (
            <p className="rounded-xl border-2 border-slate-300 bg-white p-8 text-center text-slate-400">
              Không có đơn nào trong ngày này.
            </p>
          )}
          {danhSach.map((d) => (
            <button
              key={d.id}
              onClick={() => setChonId(d.id)}
              className={[
                'w-full rounded-xl border-2 p-3 text-left transition active:scale-[0.99]',
                chonId === d.id
                  ? 'border-cyan-600 bg-cyan-50'
                  : 'border-slate-300 bg-white hover:bg-slate-50',
                d.trangThai === 'DA_HUY' ? 'opacity-60' : '',
              ].join(' ')}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-lg font-bold text-slate-900">
                  {d.khachTen ?? 'Khách vãng lai'}
                </span>
                <span className="so text-lg font-bold text-slate-900">
                  {dinhDangTien(d.tongTien)}
                </span>
              </div>
              <div className="so mt-0.5 text-xs text-slate-500">
                {d.maDon} · {dinhDangGio(d.datLuc)} · {d.nhomGiaTen}
              </div>
              <div className="mt-1 flex flex-wrap gap-1 text-xs font-semibold">
                <Nhan mau={d.trangThai === 'DA_HUY' ? 'do' : 'xam'}>
                  {NHAN_TRANG_THAI[d.trangThai]}
                </Nhan>
                {d.trangThaiDong !== 'KHONG_CAN' && (
                  <Nhan mau={d.trangThaiDong === 'DA_DONG' ? 'xanh' : 'vang'}>
                    {NHAN_DONG[d.trangThaiDong]}
                  </Nhan>
                )}
                <Nhan mau={d.trangThaiTt === 'DA_TRA' ? 'xanh' : 'vang'}>
                  {d.trangThaiTt === 'DA_TRA' ? 'Đã trả' : 'Chưa trả'}
                </Nhan>
                {d.soLanSua > 0 && <Nhan mau="xam">Đã sửa {d.soLanSua} lần</Nhan>}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- chi tiết đơn */}
      <section className="min-h-0 overflow-auto">
        {!don || !nhap ? (
          <p className="rounded-xl border-2 border-slate-300 bg-white p-10 text-center text-slate-400">
            Chọn một đơn bên trái để xem và sửa.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border-2 border-slate-300 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {don.khachTen ?? 'Khách vãng lai'}
                  </h2>
                  <p className="so text-sm text-slate-500">
                    {don.maDon} · {don.khachSdt ?? 'không có SĐT'} · {don.nhomGiaTen}
                  </p>
                </div>
                <div className="so text-right">
                  <div className="text-3xl font-bold text-slate-900">
                    {dinhDangTien(tongNhap?.tongTien ?? don.tongTien)}
                  </div>
                  <div className="text-sm text-slate-500">
                    {dinhDangKg(tongNhap?.tongKg ?? don.tongKg)}
                  </div>
                </div>
              </div>

              {don.ghiChu && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                  ⚑ {don.ghiChu}
                </p>
              )}
              {don.trangThai === 'DA_HUY' && (
                <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                  Đơn đã huỷ — {don.lyDoHuy}
                </p>
              )}
            </div>

            {/* Dòng hàng */}
            <div className="overflow-x-auto rounded-xl border-2 border-slate-300 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-3 py-2">Mặt hàng</th>
                    <th className="px-3 py-2">ĐVT</th>
                    <th className="px-3 py-2 text-right">SL</th>
                    <th className="px-3 py-2 text-right">Kg</th>
                    <th className="px-3 py-2 text-right">Kg cân lại</th>
                    <th className="px-3 py-2 text-right">Đơn giá/kg</th>
                    <th className="px-3 py-2 text-right">Thành tiền</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {nhap.map((c) => (
                    <tr key={c.id} className="border-t border-slate-200">
                      <td className="px-3 py-2 font-medium">
                        {c.loaiCaTen} — {c.sizeCaTen}
                        {c.daDong && (
                          <span className="ml-2 text-xs font-bold text-emerald-600">ĐÃ ĐÓNG</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{c.donViTen}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          defaultValue={tuPhanNghin(c.soLuong)}
                          onBlur={(e) => doiSoLuong(c, e.target.value)}
                          inputMode="decimal"
                          className="so w-20 rounded border border-slate-300 px-2 py-1 text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {c.heSoKg > 0 ? (
                          <span className="so font-semibold">{dinhDangKg(c.soKgDuKien)}</span>
                        ) : (
                          <input
                            defaultValue={gramSangKg(c.soKgDuKien)}
                            onBlur={(e) => doiKg(c, e.target.value)}
                            inputMode="decimal"
                            className="so w-24 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-right"
                          />
                        )}
                      </td>
                      <td className="so px-3 py-2 text-right text-slate-500">
                        {c.soKgThucTe == null ? '—' : dinhDangKg(c.soKgThucTe)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          defaultValue={c.donGia}
                          onBlur={(e) => doiGia(c, e.target.value)}
                          inputMode="numeric"
                          className={[
                            'so w-28 rounded border px-2 py-1 text-right',
                            c.giaSuaTay
                              ? 'border-amber-400 bg-amber-50 font-bold text-amber-900'
                              : 'border-slate-300',
                          ].join(' ')}
                        />
                      </td>
                      <td className="so px-3 py-2 text-right font-bold">
                        {dinhDangTien(c.thanhTien)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => setNhap(nhap.filter((x) => x.id !== c.id))}
                          aria-label="Xoá dòng"
                          className="h-10 w-10 rounded-lg bg-rose-50 text-lg font-bold text-rose-600 hover:bg-rose-100"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-slate-200 p-3">
                <button
                  onClick={() => setMoThemHang(true)}
                  disabled={don.trangThai === 'DA_HUY'}
                  className="h-12 rounded-xl border-2 border-dashed border-slate-300 px-5 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  + Thêm mặt hàng
                </button>
              </div>
            </div>

            {/* Chênh lệch thanh toán — FR-SD-04 */}
            {don.trangThaiTt === 'DA_TRA' && tongNhap && (
              <ChenhLech
                daNhan={don.soTienDaNhan}
                tongMoi={tongNhap.tongTien}
                donSauKhiLuu={{ ...don, tongTien: tongNhap.tongTien }}
              />
            )}

            {/* Lưu / huỷ */}
            <div className="rounded-xl border-2 border-slate-300 bg-white p-4">
              <label className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                Lý do sửa đơn — bắt buộc
              </label>
              <input
                value={lyDo}
                onChange={(e) => setLyDo(e.target.value)}
                placeholder="Cân lại thiếu 2kg / khách đổi ý bớt hàng…"
                className="mt-1 h-12 w-full rounded-xl border-2 border-slate-300 px-3 focus:border-cyan-600 focus:outline-none"
              />
              {loi && (
                <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                  {loi}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => void luu()}
                  disabled={!daDoi || !lyDo.trim()}
                  className="h-14 flex-1 rounded-xl bg-cyan-600 text-lg font-bold text-white hover:bg-cyan-700 disabled:bg-slate-300"
                >
                  {daDoi ? 'Lưu thay đổi' : 'Chưa có thay đổi'}
                </button>
                <button
                  onClick={() => setNhap(structuredClone(don.chiTiet))}
                  disabled={!daDoi}
                  className="h-14 rounded-xl bg-slate-100 px-5 font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                >
                  Hoàn tác
                </button>
                {don.trangThai !== 'DA_HUY' && (
                  <button
                    onClick={() => void huy()}
                    disabled={!lyDo.trim()}
                    className="h-14 rounded-xl bg-rose-50 px-5 font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  >
                    Huỷ đơn
                  </button>
                )}
              </div>
            </div>

            {/* Lịch sử sửa — FR-XD-04 */}
            {lichSu.length > 0 && (
              <div className="rounded-xl border-2 border-slate-300 bg-white p-4">
                <h3 className="mb-2 text-sm font-bold text-slate-700">
                  Lịch sử sửa đơn ({lichSu.length})
                </h3>
                <ul className="space-y-2">
                  {lichSu.map((v) => (
                    <li key={v.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-semibold text-slate-800">{v.lyDo}</span>
                        <span className="so text-xs text-slate-500">
                          {dinhDangGio(v.suaLuc)}
                        </span>
                      </div>
                      <div className="so mt-0.5 text-xs text-slate-500">
                        {dinhDangTien(v.tongTienTruoc)} → {dinhDangTien(v.tongTienSau)}
                        {v.tongTienSau !== v.tongTienTruoc && (
                          <span
                            className={
                              v.tongTienSau > v.tongTienTruoc
                                ? 'ml-1 font-bold text-emerald-700'
                                : 'ml-1 font-bold text-rose-700'
                            }
                          >
                            ({v.tongTienSau > v.tongTienTruoc ? '+' : ''}
                            {dinhDangTien(v.tongTienSau - v.tongTienTruoc)})
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {moThemHang && don && nhap && (
        <ThemMatHang
          donHangId={don.id}
          nhomGiaId={don.nhomGiaId}
          thuTu={nhap.length}
          onThem={(dongMoi) => setNhap(gopDongHang(nhap, dongMoi))}
          onDong={() => setMoThemHang(false)}
        />
      )}
    </div>
  );
}

function ChenhLech({
  daNhan,
  tongMoi,
  donSauKhiLuu,
}: {
  daNhan: number;
  tongMoi: number;
  donSauKhiLuu: DonHangDayDu;
}) {
  const lech = chenhLechThanhToan({ ...donSauKhiLuu, soTienDaNhan: daNhan, tongTien: tongMoi });
  if (lech === 0) return null;
  const thua = lech > 0;
  return (
    <div
      className={[
        'rounded-xl border-2 p-4 text-lg font-bold',
        thua ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-rose-300 bg-rose-50 text-rose-900',
      ].join(' ')}
    >
      {thua ? 'Khách đã trả thừa ' : 'Khách còn thiếu '}
      <span className="so">{dinhDangTien(Math.abs(lech))}</span>
      <div className="mt-1 text-sm font-normal">
        Đã nhận {dinhDangTien(daNhan)} · tổng đơn sau khi sửa {dinhDangTien(tongMoi)}
      </div>
    </div>
  );
}

function Nhan({ mau, children }: { mau: 'xam' | 'xanh' | 'vang' | 'do'; children: React.ReactNode }) {
  const lop = {
    xam: 'bg-slate-100 text-slate-600',
    xanh: 'bg-emerald-100 text-emerald-800',
    vang: 'bg-amber-100 text-amber-800',
    do: 'bg-rose-100 text-rose-800',
  }[mau];
  return <span className={`rounded px-2 py-0.5 ${lop}`}>{children}</span>;
}
