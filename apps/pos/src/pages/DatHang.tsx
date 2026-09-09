/**
 * Màn hình đặt hàng — DAC-TA.md §5.3 và §5.6.
 *
 * Bố cục POS chuẩn, thiết kế cho MÀN HÌNH CẢM ỨNG: chọn hàng bằng lưới nút
 * thay vì hộp thả xuống, nhập số bằng bàn phím số trên màn hình. Mọi mục
 * bấm được đều cao tối thiểu 56px.
 *
 * Bàn phím vật lý vẫn dùng song song — ô nhập không khoá. Ở vựa cá tay ướt,
 * mà màn hình cảm ứng điện dung dính nước là nhận sai điểm chạm.
 *
 * Giữ đúng cơ chế project cũ: số kg TỰ TÍNH bằng số lượng × hệ số quy đổi,
 * ô kg KHOÁ khi hệ số > 0. Giá luôn tính theo KG.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  dinhDangKg,
  dinhDangTien,
  gramSangKg,
  kgSangGram,
  ngayHomNay,
  taoMaDon,
  tinhSoKgDuKien,
  tinhThanhTien,
  toPhanNghin,
  tuPhanNghin,
  uuidV7,
  type ChiTietDonHang,
  type DonHangDayDu,
  type DonViTinh,
  type Gia,
  type HinhThucTT,
  type KhachHang,
  type NhomGia,
  type SanPham,
} from '@vuaca/shared';
import { nguon } from '../data/index.js';
import BanPhimSo from '../components/BanPhimSo.js';
import ChonKhach from '../components/ChonKhach.js';
import ManHinhThanhToan from './ManHinhThanhToan.js';

type BuocThanhToan = null | 'chon' | 'qr';

export default function DatHang() {
  const [nhomGia, setNhomGia] = useState<NhomGia[]>([]);
  const [donVi, setDonVi] = useState<DonViTinh[]>([]);
  const [sanPham, setSanPham] = useState<SanPham[]>([]);
  const [giaList, setGiaList] = useState<Gia[]>([]);
  const [khachList, setKhachList] = useState<KhachHang[]>([]);

  const [moChonKhach, setMoChonKhach] = useState(false);
  const [khach, setKhach] = useState<KhachHang | null>(null);
  const [nhomGiaId, setNhomGiaId] = useState('');
  const [suaNhomGiaTay, setSuaNhomGiaTay] = useState(false);
  const [canhBaoDonCu, setCanhBaoDonCu] = useState<DonHangDayDu | null>(null);

  const [dong, setDong] = useState<ChiTietDonHang[]>([]);
  const [ghiChu, setGhiChu] = useState('');

  const [loaiCaId, setLoaiCaId] = useState('');
  const [spId, setSpId] = useState('');
  const [dvId, setDvId] = useState('');
  const [soLuongStr, setSoLuongStr] = useState('1');

  const [buoc, setBuoc] = useState<BuocThanhToan>(null);
  const [xong, setXong] = useState<DonHangDayDu | null>(null);

  useEffect(() => {
    void (async () => {
      const [ng, dv, sp, g, kh] = await Promise.all([
        nguon.layNhomGia(),
        nguon.layDonViTinh(),
        nguon.laySanPham(),
        nguon.layGiaHienHanh(),
        nguon.layKhachHang(),
      ]);
      setNhomGia(ng);
      setDonVi(dv);
      setSanPham(sp);
      setGiaList(g);
      setKhachList(kh);
      setNhomGiaId(ng.find((n) => n.laMacDinh)?.id ?? ng[0]?.id ?? '');
      setLoaiCaId(sp[0]?.loaiCaId ?? '');
      setSpId(sp[0]?.id ?? '');
      setDvId(dv[0]?.id ?? '');
    })();
  }, []);

  const nhomDangDung = nhomGia.find((n) => n.id === nhomGiaId) ?? null;
  const dvDangChon = donVi.find((d) => d.id === dvId) ?? null;
  const quyDoiDuoc = (dvDangChon?.heSoKg ?? 0) > 0;

  /** Loại cá làm tab, size làm ô chọn bên dưới. */
  const loaiCa = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sanPham) if (!m.has(s.loaiCaId)) m.set(s.loaiCaId, s.loaiCaTen);
    return [...m].map(([id, ten]) => ({ id, ten }));
  }, [sanPham]);

  const sizeCua = useMemo(
    () => sanPham.filter((s) => s.loaiCaId === loaiCaId).sort((a, b) => a.thuTuSize - b.thuTuSize),
    [sanPham, loaiCaId],
  );

  const giaCua = (sanPhamId: string) =>
    giaList.find((g) => g.sanPhamId === sanPhamId && g.nhomGiaId === nhomGiaId);

  const soLuongSo = Number(soLuongStr.replace(',', '.')) || 0;
  const giaHienTai = giaCua(spId);
  const spDangChon = sanPham.find((s) => s.id === spId);

  const soKgXemTruoc = quyDoiDuoc
    ? tinhSoKgDuKien(toPhanNghin(soLuongSo), dvDangChon!.heSoKg)
    : kgSangGram(soLuongSo);

  const tongTien = dong.reduce((s, c) => s + c.thanhTien, 0);
  const tongKg = dong.reduce((s, c) => s + c.soKgDuKien, 0);

  async function chonKhach(k: KhachHang | null) {
    setKhach(k);
    setMoChonKhach(false);
    setSuaNhomGiaTay(false);
    if (k) {
      setNhomGiaId(k.nhomGiaId);
      const donCu = await nguon.layDonChuaXongCuaKhach(k.id);
      setCanhBaoDonCu(donCu[0] ?? null);
    } else {
      setNhomGiaId(nhomGia.find((n) => n.laMacDinh)?.id ?? nhomGia[0]?.id ?? '');
      setCanhBaoDonCu(null);
    }
  }

  function themDong() {
    const sp = spDangChon;
    const dv = dvDangChon;
    if (!sp || !dv || !giaHienTai) return;

    const sl = toPhanNghin(soLuongSo);
    if (sl <= 0 || soKgXemTruoc <= 0) return;

    // FR-DH-10: cùng (sản phẩm, đơn vị tính) thì cộng dồn, không tạo dòng mới
    const cu = dong.find((c) => c.sanPhamId === sp.id && c.donViTinhId === dv.id);
    if (cu) {
      const slMoi = cu.soLuong + sl;
      const kgMoi = cu.soKgDuKien + soKgXemTruoc;
      setDong(
        dong.map((c) =>
          c.id === cu.id
            ? { ...c, soLuong: slMoi, soKgDuKien: kgMoi, thanhTien: tinhThanhTien(kgMoi, c.donGia) }
            : c,
        ),
      );
    } else {
      setDong([
        ...dong,
        {
          id: uuidV7(),
          donHangId: '',
          sanPhamId: sp.id,
          loaiCaTen: sp.loaiCaTen,
          sizeCaTen: sp.sizeCaTen,
          donViTinhId: dv.id,
          donViTen: dv.ten,
          heSoKg: dv.heSoKg,
          soLuong: sl,
          soKgDuKien: soKgXemTruoc,
          soKgThucTe: null,
          donGia: giaHienTai.gia,
          giaSuaTay: false,
          bangGiaId: giaHienTai.bangGiaId,
          thanhTien: tinhThanhTien(soKgXemTruoc, giaHienTai.gia),
          ghiChu: null,
          thuTu: dong.length,
          daDong: false,
          dongLuc: null,
        },
      ]);
    }
    setSoLuongStr('1');
  }

  async function dungDon(): Promise<DonHangDayDu> {
    const ngayBan = ngayHomNay();
    const stt = await nguon.soThuTuTiepTheo(ngayBan);
    const id = uuidV7();
    const bayGio = new Date().toISOString();
    const nhom = nhomDangDung!;

    return {
      id,
      maDon: taoMaDon('POS', ngayBan, stt),
      nguon: 'POS',
      khachHangId: khach?.id ?? null,
      khachTen: khach?.hoTen ?? null,
      khachSdt: khach?.soDienThoai ?? null,
      khachDiaChi: khach?.diaChi ?? null,
      nhomGiaId: nhom.id,
      nhomGiaTen: nhom.ten,
      laSi: nhom.laSi,
      nhomGiaSuaTay: suaNhomGiaTay,
      tongTien,
      tongKg,
      trangThai: 'DA_XAC_NHAN',
      trangThaiDong: nhom.laSi ? 'CHO_DONG' : 'KHONG_CAN',
      trangThaiTt: 'CHUA_TRA',
      hinhThucTt: null,
      soTienDaNhan: 0,
      cauHinhQrId: null,
      qrPayload: null,
      ghiChu: ghiChu.trim() || null,
      lyDoHuy: null,
      ngayBan,
      datLuc: bayGio,
      xacNhanLuc: bayGio,
      batDauDongLuc: null,
      dongXongLuc: null,
      hoanTatLuc: null,
      lanSuaCuoi: null,
      soLanSua: 0,
      chiTiet: dong.map((c, i) => ({ ...c, donHangId: id, thuTu: i })),
    };
  }

  async function xacNhan() {
    if (dong.length === 0) return;
    if (nhomDangDung?.laSi) {
      const don = await dungDon();
      await nguon.luuDon(don);
      setXong(don);
      return;
    }
    setBuoc('chon');
  }

  async function daNhanTien(hinhThuc: HinhThucTT, qrPayload: string | null, qrId: string | null) {
    const don = await dungDon();
    don.trangThaiTt = 'DA_TRA';
    don.hinhThucTt = hinhThuc;
    don.soTienDaNhan = don.tongTien;
    don.qrPayload = qrPayload;
    don.cauHinhQrId = qrId;
    don.hoanTatLuc = new Date().toISOString();
    don.trangThai = 'HOAN_TAT';
    await nguon.luuDon(don);
    setBuoc(null);
    setXong(don);
  }

  function donMoi() {
    setKhach(null);
    setDong([]);
    setGhiChu('');
    setXong(null);
    setBuoc(null);
    setSuaNhomGiaTay(false);
    setCanhBaoDonCu(null);
    setSoLuongStr('1');
    setNhomGiaId(nhomGia.find((n) => n.laMacDinh)?.id ?? nhomGia[0]?.id ?? '');
  }

  // ------------------------------------------------------------------ render

  if (buoc) {
    return (
      <ManHinhThanhToan
        buoc={buoc}
        setBuoc={setBuoc}
        tongTien={tongTien}
        maDonTam={`POS ${ngayHomNay().replaceAll('-', '')}`}
        onDaNhanTien={daNhanTien}
      />
    );
  }

  if (xong) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-300 bg-white p-8 text-center">
        <h2 className="text-2xl font-bold text-emerald-700">
          {xong.laSi ? 'Đã ghi nhận đơn đặt hàng' : 'Đơn hàng hoàn tất'}
        </h2>
        <p className="so mt-2 text-base font-semibold text-slate-500">{xong.maDon}</p>
        <p className="so mt-2 text-4xl font-bold text-slate-900">{dinhDangTien(xong.tongTien)}</p>
        {xong.laSi && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-base text-amber-800">
            Đơn đã vào bảng đóng hàng. Khách thanh toán sau.
          </p>
        )}
        <button
          onClick={donMoi}
          className="mt-6 h-16 w-full rounded-xl bg-cyan-600 text-xl font-bold text-white hover:bg-cyan-700 active:scale-[0.99]"
        >
          Đơn mới
        </button>
      </div>
    );
  }

  return (
    <div className="grid h-full gap-3 p-3 xl:grid-cols-[1fr_400px]">
      {/* ================================================= chọn hàng (trái) */}
      <section className="flex min-h-0 flex-col gap-3">
        {/* Loại cá */}
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
                'h-14 rounded-xl border-2 px-6 text-lg font-bold transition active:scale-[0.98]',
                loaiCaId === lc.id
                  ? 'border-cyan-600 bg-cyan-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              {lc.ten}
            </button>
          ))}
        </div>

        {/* Size + giá */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {sizeCua.map((s) => {
            const g = giaCua(s.id);
            const dangChon = spId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSpId(s.id)}
                disabled={!g}
                className={[
                  'h-24 rounded-xl border-2 px-3 text-left transition active:scale-[0.98]',
                  !g
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300'
                    : dangChon
                      ? 'border-cyan-600 bg-cyan-50'
                      : 'border-slate-300 bg-white hover:bg-slate-50',
                ].join(' ')}
              >
                <div className="text-lg font-bold text-slate-900">{s.sizeCaTen}</div>
                <div className="so mt-1 text-base font-semibold text-cyan-700">
                  {g ? `${dinhDangTien(g.gia)}/kg` : 'chưa có giá'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Đơn vị tính */}
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-sm font-bold text-slate-500">Đơn vị:</span>
          {donVi.map((d) => (
            <button
              key={d.id}
              onClick={() => setDvId(d.id)}
              className={[
                'h-14 rounded-xl border-2 px-5 text-base font-bold transition active:scale-[0.98]',
                dvId === d.id
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
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

        {/* Số lượng + bàn phím số */}
        <div className="grid min-h-0 flex-1 gap-3 sm:grid-cols-[260px_1fr]">
          <div>
            <BanPhimSo giaTri={soLuongStr} onDoi={setSoLuongStr} onXoaHet={() => setSoLuongStr('')} />
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-300 bg-white p-4">
            <div className="space-y-3">
              <div>
                <div className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                  Số lượng ({dvDangChon?.ten})
                </div>
                <input
                  value={soLuongStr}
                  onChange={(e) => setSoLuongStr(e.target.value.replace(/[^\d,.]/g, ''))}
                  inputMode="decimal"
                  className="so mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-3xl font-bold focus:border-cyan-600 focus:outline-none"
                />
              </div>

              <div>
                <div className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                  Số kg {quyDoiDuoc ? '(tự tính)' : '(nhập tay)'}
                </div>
                <div
                  className={[
                    'so mt-1 rounded-lg px-3 py-2 text-right text-3xl font-bold',
                    quyDoiDuoc ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-900',
                  ].join(' ')}
                >
                  {gramSangKg(soKgXemTruoc).toFixed(3)}
                </div>
                {quyDoiDuoc && (
                  <p className="so mt-1 text-right text-xs text-slate-400">
                    {soLuongSo} × {tuPhanNghin(dvDangChon!.heSoKg)} kg
                  </p>
                )}
              </div>

              <div className="so text-right text-sm text-slate-500">
                {giaHienTai ? (
                  <>
                    Thành tiền{' '}
                    <b className="text-xl text-slate-900">
                      {dinhDangTien(tinhThanhTien(soKgXemTruoc, giaHienTai.gia))}
                    </b>
                  </>
                ) : (
                  <span className="font-bold text-rose-600">Sản phẩm chưa có giá</span>
                )}
              </div>
            </div>

            <button
              onClick={themDong}
              disabled={!giaHienTai || soKgXemTruoc <= 0}
              className="mt-3 h-16 w-full rounded-xl bg-slate-900 text-xl font-bold text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:bg-slate-300"
            >
              Thêm vào đơn
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================== giỏ hàng (phải) */}
      <aside className="flex min-h-0 flex-col gap-3">
        <button
          onClick={() => setMoChonKhach(true)}
          className="rounded-xl border-2 border-slate-300 bg-white p-3 text-left transition hover:border-cyan-500 active:scale-[0.99]"
        >
          <div className="text-xs font-bold tracking-wide text-slate-500 uppercase">
            Khách hàng
          </div>
          <div className="text-xl font-bold text-slate-900">
            {khach?.hoTen ?? 'Khách vãng lai'}
          </div>
          <div className="so text-sm text-slate-500">{khach?.soDienThoai ?? 'bấm để chọn'}</div>
        </button>

        <div className="rounded-xl border-2 border-slate-300 bg-white p-3">
          <div className="text-xs font-bold tracking-wide text-slate-500 uppercase">
            Bảng giá áp dụng
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {nhomGia.map((n) => {
              const choPhep = khach !== null || !n.laSi;
              return (
                <button
                  key={n.id}
                  disabled={!choPhep}
                  onClick={() => {
                    setNhomGiaId(n.id);
                    setSuaNhomGiaTay(n.id !== khach?.nhomGiaId);
                  }}
                  className={[
                    'h-12 rounded-lg border-2 px-3 text-sm font-bold transition active:scale-[0.98]',
                    !choPhep
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300'
                      : nhomGiaId === n.id
                        ? 'border-cyan-600 bg-cyan-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700',
                  ].join(' ')}
                >
                  {n.ten}
                </button>
              );
            })}
          </div>
          {suaNhomGiaTay && (
            <p className="mt-2 text-xs font-bold text-amber-700">
              Đã đổi bảng giá thủ công so với nhóm giá của khách.
            </p>
          )}
          {!khach && (
            <p className="mt-2 text-xs text-slate-400">
              Khách vãng lai không được áp giá sỉ. Muốn giá sỉ phải chọn hồ sơ khách.
            </p>
          )}
        </div>

        {canhBaoDonCu && (
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-sm">
            <p className="font-bold text-amber-900">
              {canhBaoDonCu.khachTen} đang có đơn chưa hoàn tất
            </p>
            <p className="mt-1 text-amber-800">
              Khách gọi thêm thì nên sửa đơn cũ, không tạo đơn mới (FR-SD-09).
            </p>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto rounded-xl border-2 border-slate-300 bg-white">
          {dong.length === 0 ? (
            <p className="p-8 text-center text-slate-400">Chưa có mặt hàng nào.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {dong.map((c) => (
                <li key={c.id} className="flex items-start gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900">
                      {c.loaiCaTen} — {c.sizeCaTen}
                    </div>
                    <div className="so text-sm text-slate-500">
                      {tuPhanNghin(c.soLuong)} {c.donViTen} · {dinhDangKg(c.soKgDuKien)} ·{' '}
                      {dinhDangTien(c.donGia)}/kg
                      {c.giaSuaTay && (
                        <span className="ml-1 font-bold text-amber-700">· SỬA TAY</span>
                      )}
                    </div>
                    <div className="so mt-1 text-lg font-bold text-slate-900">
                      {dinhDangTien(c.thanhTien)}
                    </div>
                  </div>
                  <button
                    onClick={() => setDong(dong.filter((x) => x.id !== c.id))}
                    aria-label="Xoá dòng"
                    className="h-12 w-12 shrink-0 rounded-lg bg-rose-50 text-xl font-bold text-rose-600 hover:bg-rose-100 active:scale-95"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <input
          value={ghiChu}
          onChange={(e) => setGhiChu(e.target.value)}
          placeholder="Ghi chú đơn — giao trước 10h…"
          className="h-12 rounded-xl border-2 border-slate-300 px-3 focus:border-cyan-600 focus:outline-none"
        />

        <div className="rounded-xl border-2 border-slate-300 bg-white p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-500">
              {dong.length} mặt hàng · {dinhDangKg(tongKg)}
            </span>
            <span className="so text-3xl font-bold text-slate-900">{dinhDangTien(tongTien)}</span>
          </div>
          <button
            onClick={() => void xacNhan()}
            disabled={dong.length === 0}
            className="mt-3 h-20 w-full rounded-xl bg-cyan-600 text-2xl font-bold text-white transition hover:bg-cyan-700 active:scale-[0.99] disabled:bg-slate-300"
          >
            Xác nhận đơn
          </button>
        </div>
      </aside>

      {moChonKhach && (
        <ChonKhach
          khachList={khachList}
          nhomGia={nhomGia}
          onChon={(k) => void chonKhach(k)}
          onDong={() => setMoChonKhach(false)}
        />
      )}
    </div>
  );
}
