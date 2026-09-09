/** Thống kê cuối ngày — DAC-TA.md §5.8. */

import { useCallback, useEffect, useState } from 'react';
import {
  dinhDangGio,
  dinhDangKg,
  dinhDangTien,
  ngayHomNay,
  type DonHangDayDu,
  type ThongKeNgay,
} from '@vuaca/shared';
import { nguon } from '../data/index.js';

export default function ThongKe() {
  const [ngay, setNgay] = useState(() => ngayHomNay());
  const [tk, setTk] = useState<ThongKeNgay | null>(null);
  const [don, setDon] = useState<DonHangDayDu[]>([]);

  const nap = useCallback(async () => {
    const [t, d] = await Promise.all([nguon.thongKe(ngay), nguon.layDonTheoNgay(ngay)]);
    setTk(t);
    setDon(d);
  }, [ngay]);

  useEffect(() => {
    void nap();
  }, [nap]);

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900">Thống kê</h1>
        <input
          type="date"
          value={ngay}
          onChange={(e) => setNgay(e.target.value)}
          className="so rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>

      {tk && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <O nhan="Tổng doanh thu" giaTri={dinhDangTien(tk.tongDoanhThu)} noiBat />
          <O nhan="Số đơn" giaTri={String(tk.soDon)} />
          <O nhan="Tổng đã bán" giaTri={dinhDangKg(tk.tongKgDaBan)} />
          <O nhan="Đơn sỉ / lẻ" giaTri={`${tk.soDonSi} / ${tk.soDonLe}`} />
          <O nhan="Thu tiền mặt" giaTri={dinhDangTien(tk.thuTienMat)} />
          <O nhan="Thu chuyển khoản" giaTri={dinhDangTien(tk.thuChuyenKhoan)} />
          <O nhan="Chưa thu" giaTri={dinhDangTien(tk.chuaThu)} canhBao={tk.chuaThu > 0} />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
            <tr>
              <th className="px-3 py-2">Mã đơn</th>
              <th className="px-3 py-2">Giờ</th>
              <th className="px-3 py-2">Khách hàng</th>
              <th className="px-3 py-2">Bảng giá</th>
              <th className="px-3 py-2 text-right">Mặt hàng</th>
              <th className="px-3 py-2 text-right">Số kg</th>
              <th className="px-3 py-2 text-right">Tổng tiền</th>
              <th className="px-3 py-2">Thanh toán</th>
              <th className="px-3 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {don.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-slate-400">
                  Không có đơn nào trong ngày này.
                </td>
              </tr>
            ) : (
              don.map((d) => (
                <tr
                  key={d.id}
                  className={[
                    'border-t border-slate-200',
                    d.trangThai === 'DA_HUY' ? 'text-slate-400 line-through' : '',
                  ].join(' ')}
                >
                  <td className="so px-3 py-2 font-semibold">{d.maDon}</td>
                  <td className="so px-3 py-2 text-slate-500">{dinhDangGio(d.datLuc)}</td>
                  <td className="px-3 py-2 font-medium">{d.khachTen ?? 'Khách vãng lai'}</td>
                  <td className="px-3 py-2 text-slate-500">{d.nhomGiaTen}</td>
                  <td className="so px-3 py-2 text-right">{d.chiTiet.length}</td>
                  <td className="so px-3 py-2 text-right">{dinhDangKg(d.tongKg)}</td>
                  <td className="so px-3 py-2 text-right font-bold">{dinhDangTien(d.tongTien)}</td>
                  <td className="px-3 py-2">
                    {d.trangThaiTt === 'DA_TRA' ? (
                      <span className="text-emerald-700">
                        {d.hinhThucTt === 'TIEN_MAT' ? 'Tiền mặt' : 'Chuyển khoản'}
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-700">Chưa trả</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{NHAN_TRANG_THAI[d.trangThai]}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const NHAN_TRANG_THAI: Record<string, string> = {
  NHAP: 'Nháp',
  DA_XAC_NHAN: 'Đã xác nhận',
  HOAN_TAT: 'Hoàn tất',
  DA_HUY: 'Đã huỷ',
};

function O({
  nhan,
  giaTri,
  noiBat,
  canhBao,
}: {
  nhan: string;
  giaTri: string;
  noiBat?: boolean;
  canhBao?: boolean;
}) {
  return (
    <div
      className={[
        'rounded-xl border p-3',
        noiBat ? 'border-cyan-300 bg-cyan-50' : 'border-slate-300 bg-white',
      ].join(' ')}
    >
      <div className="text-xs font-semibold text-slate-500">{nhan}</div>
      <div
        className={[
          'so mt-1 font-bold',
          noiBat ? 'text-2xl text-cyan-900' : 'text-lg text-slate-900',
          canhBao ? 'text-amber-700' : '',
        ].join(' ')}
      >
        {giaTri}
      </div>
    </div>
  );
}
