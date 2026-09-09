/**
 * Bảng đóng hàng — DAC-TA.md §5.5.
 *
 * Một bảng duy nhất, toàn bộ đơn đang cần đóng kèm mọi dòng hàng. Không phải
 * bấm mở từng đơn. KHÔNG hiển thị mã đơn (FR-DG-04b) và KHÔNG hiển thị tiền
 * (FR-DG-10) — nhân viên đóng hàng nhận biết đơn bằng TÊN KHÁCH.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  dinhDangDaCho,
  dinhDangGio,
  dinhDangKg,
  dinhDangSoLuong,
  gramSangKg,
  kgSangGram,
  soKgTinhTien,
  type DonHangDayDu,
} from '@vuaca/shared';
import { nguon } from '../data/index.js';

const CHO_QUA_LAU_MS = 30 * 60_000;

export default function BangDongHang() {
  const [donHang, setDonHang] = useState<DonHangDayDu[]>([]);
  const [bayGio, setBayGio] = useState(() => new Date());

  const nap = useCallback(async () => {
    setDonHang(await nguon.layBangDongHang());
  }, []);

  useEffect(() => {
    void nap();
    // Tạm thời hỏi lại theo chu kỳ. Khi có SQLite sẽ đổi sang lắng nghe sự
    // kiện thay đổi, đúng yêu cầu "tự cập nhật, không tải lại trang".
    const t = setInterval(() => {
      void nap();
      setBayGio(new Date());
    }, 2000);
    return () => clearInterval(t);
  }, [nap]);

  const tong = useMemo(() => {
    const dong = donHang.flatMap((d) => d.chiTiet);
    return {
      soDon: donHang.length,
      soMatHang: dong.length,
      daDong: dong.filter((c) => c.daDong).length,
      tongKg: dong.reduce((s, c) => s + soKgTinhTien(c.soKgDuKien, c.soKgThucTe), 0),
    };
  }, [donHang]);

  async function tick(donId: string, dongId: string, daDong: boolean) {
    await nguon.datTrangThaiDong(donId, dongId, daDong);
    await nap();
  }

  async function nhapKg(donId: string, dongId: string, chuoi: string) {
    const s = chuoi.trim().replace(',', '.');
    const kg = s === '' ? null : Number(s);
    if (kg !== null && (!Number.isFinite(kg) || kg <= 0)) return;
    await nguon.datKgThucTe(donId, dongId, kg === null ? null : kgSangGram(kg));
    await nap();
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <h1 className="text-xl font-bold text-slate-900">Hàng cần đóng</h1>
        <p className="so text-base font-semibold text-slate-600">
          {tong.soDon} đơn đang chờ · {tong.daDong}/{tong.soMatHang} mặt hàng đã đóng ·{' '}
          {dinhDangKg(tong.tongKg)}
        </p>
      </div>

      {donHang.length === 0 ? (
        <p className="rounded-xl border border-slate-300 bg-white p-8 text-center text-lg text-slate-500">
          Không có đơn nào đang chờ đóng.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-100 text-xs font-bold tracking-wide text-slate-600 uppercase">
              <tr>
                <th className="px-3 py-2">Khách hàng</th>
                <th className="px-3 py-2">Loại cá</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">ĐVT</th>
                <th className="px-3 py-2 text-right">SL</th>
                <th className="px-3 py-2 text-right">Kg dự kiến</th>
                <th className="px-3 py-2 text-right">Kg cân lại</th>
                <th className="px-3 py-2">Ghi chú</th>
                <th className="px-3 py-2 text-center">Xong</th>
              </tr>
            </thead>

            <tbody>
              {donHang.map((don) => {
                const cho = bayGio.getTime() - new Date(don.datLuc).getTime();
                const quaLau = cho > CHO_QUA_LAU_MS;

                return don.chiTiet.map((dong, i) => (
                  <tr
                    key={dong.id}
                    className={[
                      i === 0 ? 'border-t-4 border-t-slate-400' : 'border-t border-t-slate-200',
                      dong.daDong ? 'bg-emerald-50/60 text-slate-400' : '',
                    ].join(' ')}
                  >
                    {i === 0 && (
                      <td
                        rowSpan={don.chiTiet.length}
                        className={[
                          'border-r border-slate-200 px-3 py-2 align-top',
                          quaLau ? 'bg-rose-50' : '',
                        ].join(' ')}
                      >
                        <div className="text-lg leading-tight font-bold tracking-wide text-slate-900 uppercase">
                          {don.khachTen ?? 'Khách vãng lai'}
                        </div>
                        {don.khachSdt && (
                          <div className="so text-sm text-slate-500">{don.khachSdt}</div>
                        )}
                        <div className="mt-0.5 text-sm text-slate-500 italic">
                          {don.nhomGiaTen}
                        </div>
                        <div
                          className={[
                            'so mt-1 text-sm font-semibold',
                            quaLau ? 'text-rose-700' : 'text-slate-600',
                          ].join(' ')}
                        >
                          {dinhDangGio(don.datLuc)} · {dinhDangDaCho(don.datLuc, bayGio)}
                        </div>
                        {quaLau && (
                          <div className="mt-1 inline-block rounded bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
                            CHỜ QUÁ LÂU
                          </div>
                        )}
                        {don.ghiChu && (
                          <div className="mt-2 rounded bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-900">
                            ⚑ {don.ghiChu}
                          </div>
                        )}
                      </td>
                    )}

                    <td className="px-3 py-2 font-medium">{dong.loaiCaTen}</td>
                    <td className="px-3 py-2">{dong.sizeCaTen}</td>
                    <td className="px-3 py-2 text-slate-500">{dong.donViTen}</td>
                    <td className="so px-3 py-2 text-right font-semibold">
                      {dinhDangSoLuong(dong.soLuong)}
                    </td>
                    <td className="so px-3 py-2 text-right text-xl font-bold text-slate-900">
                      {dinhDangKg(dong.soKgDuKien)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label="Số kg cân lại"
                        defaultValue={
                          dong.soKgThucTe == null ? '' : String(gramSangKg(dong.soKgThucTe))
                        }
                        onBlur={(e) => void nhapKg(don.id, dong.id, e.target.value)}
                        placeholder="—"
                        className="so w-24 rounded border border-slate-300 px-2 py-1 text-right text-lg font-semibold focus:border-cyan-600 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-600">{dong.ghiChu}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        aria-label="Đã đóng xong dòng này"
                        checked={dong.daDong}
                        onChange={(e) => void tick(don.id, dong.id, e.target.checked)}
                        className="h-6 w-6 accent-emerald-600"
                      />
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
