/**
 * Bảng thêm mặt hàng — dùng khi sửa đơn (FR-SD-02).
 *
 * Dùng chung logic dựng dòng hàng với màn hình đặt hàng qua `taoDongHang`
 * của `@vuaca/shared`, nên hai chỗ không bao giờ tính ra kết quả khác nhau.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  dinhDangTien,
  gramSangKg,
  kgSangGram,
  taoDongHang,
  tinhSoKgDuKien,
  tinhThanhTien,
  toPhanNghin,
  tuPhanNghin,
  uuidV7,
  type ChiTietDonHang,
  type DonViTinh,
  type Gia,
  type SanPham,
} from '@vuaca/shared';
import { nguon } from '../data/index.js';
import BanPhimSo from './BanPhimSo.js';

interface Props {
  donHangId: string;
  nhomGiaId: string;
  thuTu: number;
  onThem: (dong: ChiTietDonHang) => void;
  onDong: () => void;
}

export default function ThemMatHang({ donHangId, nhomGiaId, thuTu, onThem, onDong }: Props) {
  const [sanPham, setSanPham] = useState<SanPham[]>([]);
  const [donVi, setDonVi] = useState<DonViTinh[]>([]);
  const [gia, setGia] = useState<Gia[]>([]);

  const [loaiCaId, setLoaiCaId] = useState('');
  const [spId, setSpId] = useState('');
  const [dvId, setDvId] = useState('');
  const [soLuongStr, setSoLuongStr] = useState('1');

  useEffect(() => {
    void (async () => {
      const [sp, dv, g] = await Promise.all([
        nguon.laySanPham(),
        nguon.layDonViTinh(),
        nguon.layGiaHienHanh(),
      ]);
      setSanPham(sp);
      setDonVi(dv);
      setGia(g);
      setLoaiCaId(sp[0]?.loaiCaId ?? '');
      setSpId(sp[0]?.id ?? '');
      setDvId(dv[0]?.id ?? '');
    })();
  }, []);

  const loaiCa = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sanPham) if (!m.has(s.loaiCaId)) m.set(s.loaiCaId, s.loaiCaTen);
    return [...m].map(([id, ten]) => ({ id, ten }));
  }, [sanPham]);

  const sizeCua = useMemo(
    () => sanPham.filter((s) => s.loaiCaId === loaiCaId).sort((a, b) => a.thuTuSize - b.thuTuSize),
    [sanPham, loaiCaId],
  );

  const dvDangChon = donVi.find((d) => d.id === dvId) ?? null;
  const quyDoiDuoc = (dvDangChon?.heSoKg ?? 0) > 0;
  const spDangChon = sanPham.find((s) => s.id === spId) ?? null;
  const giaHienTai = gia.find((g) => g.sanPhamId === spId && g.nhomGiaId === nhomGiaId);

  const soLuongSo = Number(soLuongStr.replace(',', '.')) || 0;
  const soKg = quyDoiDuoc
    ? tinhSoKgDuKien(toPhanNghin(soLuongSo), dvDangChon!.heSoKg)
    : kgSangGram(soLuongSo);

  function them() {
    if (!spDangChon || !dvDangChon || !giaHienTai || soKg <= 0) return;
    onThem(
      taoDongHang({
        id: uuidV7(),
        donHangId,
        thuTu,
        sanPham: spDangChon,
        donVi: dvDangChon,
        soLuong: toPhanNghin(soLuongSo),
        soKgTuNhap: soKg,
        donGia: giaHienTai.gia,
        bangGiaId: giaHienTai.bangGiaId,
      }),
    );
    onDong();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-full w-full max-w-4xl flex-col overflow-auto rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-bold text-slate-900">Thêm mặt hàng vào đơn</h2>
          <button
            onClick={onDong}
            className="h-12 rounded-xl bg-slate-100 px-5 font-bold text-slate-600 hover:bg-slate-200"
          >
            Đóng
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {loaiCa.map((lc) => (
                <button
                  key={lc.id}
                  onClick={() => {
                    setLoaiCaId(lc.id);
                    const dau = sanPham.find((s) => s.loaiCaId === lc.id);
                    if (dau) setSpId(dau.id);
                  }}
                  className={[
                    'h-14 rounded-xl border-2 px-5 text-base font-bold active:scale-[0.98]',
                    loaiCaId === lc.id
                      ? 'border-cyan-600 bg-cyan-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700',
                  ].join(' ')}
                >
                  {lc.ten}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {sizeCua.map((s) => {
                const g = gia.find((x) => x.sanPhamId === s.id && x.nhomGiaId === nhomGiaId);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSpId(s.id)}
                    disabled={!g}
                    className={[
                      'h-20 rounded-xl border-2 px-3 text-left active:scale-[0.98]',
                      !g
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300'
                        : spId === s.id
                          ? 'border-cyan-600 bg-cyan-50'
                          : 'border-slate-300 bg-white',
                    ].join(' ')}
                  >
                    <div className="font-bold text-slate-900">{s.sizeCaTen}</div>
                    <div className="so text-sm font-semibold text-cyan-700">
                      {g ? `${dinhDangTien(g.gia)}/kg` : 'chưa có giá'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              {donVi.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDvId(d.id)}
                  className={[
                    'h-14 rounded-xl border-2 px-4 text-base font-bold active:scale-[0.98]',
                    dvId === d.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-700',
                  ].join(' ')}
                >
                  {d.ten}
                  {d.heSoKg > 0 && (
                    <span className="so ml-2 text-xs font-normal opacity-70">
                      {tuPhanNghin(d.heSoKg)} kg
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">
                Số lượng ({dvDangChon?.ten})
              </div>
              <input
                value={soLuongStr}
                onChange={(e) => setSoLuongStr(e.target.value.replace(/[^\d,.]/g, ''))}
                inputMode="decimal"
                className="so mt-1 h-14 w-full rounded-lg border-2 border-slate-300 px-3 text-right text-2xl font-bold"
              />
            </div>
            <div className="so rounded-lg bg-slate-100 px-3 py-2 text-right text-2xl font-bold text-slate-700">
              {gramSangKg(soKg).toFixed(3)} kg
            </div>
            {giaHienTai && (
              <div className="so text-right text-sm text-slate-500">
                Thành tiền{' '}
                <b className="text-lg text-slate-900">
                  {dinhDangTien(tinhThanhTien(soKg, giaHienTai.gia))}
                </b>
              </div>
            )}
            <BanPhimSo giaTri={soLuongStr} onDoi={setSoLuongStr} onXoaHet={() => setSoLuongStr('')} />
            <button
              onClick={them}
              disabled={!giaHienTai || soKg <= 0}
              className="h-16 w-full rounded-xl bg-slate-900 text-xl font-bold text-white hover:bg-slate-800 disabled:bg-slate-300"
            >
              Thêm vào đơn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
