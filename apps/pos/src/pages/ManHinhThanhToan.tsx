/**
 * Màn hình thanh toán khách lẻ — DAC-TA.md §5.6.
 *
 * Giữ nguyên luồng của project cũ (`TaoDonHang.jsx`):
 *   chọn Tiền mặt / Quét QR  ->  hiện QR  ->  "Đã nhận tiền, hoàn tất"
 * Đơn CHỈ được ghi nhận ở bước cuối, không phải lúc hiện QR (FR-TT-03).
 *
 * Khác project cũ ở một điểm: QR sinh CỤC BỘ theo chuẩn EMVCo thay vì gọi
 * img.vietqr.io, nên vẫn hiện được khi mất Internet (FR-TT-05).
 */

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  dinhDangTien,
  taoPayloadVietQR,
  type CauHinhQR,
  type Dong,
  type HinhThucTT,
} from '@vuaca/shared';
import { nguon } from '../data/index.js';

interface Props {
  buoc: 'chon' | 'qr';
  setBuoc: (b: null | 'chon' | 'qr') => void;
  tongTien: Dong;
  maDonTam: string;
  onDaNhanTien: (
    hinhThuc: HinhThucTT,
    qrPayload: string | null,
    cauHinhQrId: string | null,
  ) => Promise<void>;
}

export default function ManHinhThanhToan({
  buoc,
  setBuoc,
  tongTien,
  maDonTam,
  onDaNhanTien,
}: Props) {
  const [cauHinh, setCauHinh] = useState<CauHinhQR | null>(null);
  const [anhQR, setAnhQR] = useState<string | null>(null);
  const [payload, setPayload] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    void nguon.layCauHinhQR().then(setCauHinh);
  }, []);

  useEffect(() => {
    if (buoc !== 'qr' || !cauHinh) return;
    try {
      const p = taoPayloadVietQR({
        binNganHang: cauHinh.nganHangBin,
        soTaiKhoan: cauHinh.soTaiKhoan,
        soTien: tongTien,
        noiDung: maDonTam,
      });
      setPayload(p);
      setLoi(null);
      // Sinh ảnh ngay trong máy, không gọi mạng
      void QRCode.toDataURL(p, { errorCorrectionLevel: 'M', width: 280, margin: 1 }).then(
        setAnhQR,
      );
    } catch (e) {
      setLoi(e instanceof Error ? e.message : String(e));
    }
  }, [buoc, cauHinh, tongTien, maDonTam]);

  if (buoc === 'chon') {
    return (
      <Khung tieuDe="Xác nhận thanh toán" tongTien={tongTien}>
        <p className="mt-2 text-xs text-slate-400">
          Đơn hàng chỉ được ghi nhận sau khi xác nhận đã nhận tiền.
        </p>
        <div className="my-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => void onDaNhanTien('TIEN_MAT', null, null)}
            className="rounded-xl bg-cyan-600 p-4 text-sm font-bold text-white hover:bg-cyan-700"
          >
            Tiền mặt
          </button>
          <button
            onClick={() => setBuoc('qr')}
            className="rounded-xl bg-cyan-600 p-4 text-sm font-bold text-white hover:bg-cyan-700"
          >
            Quét QR
          </button>
        </div>
        <button onClick={() => setBuoc(null)} className="text-xs text-slate-400 underline">
          Huỷ, quay lại chỉnh sửa đơn
        </button>
      </Khung>
    );
  }

  return (
    <Khung tieuDe="Quét mã để thanh toán" tongTien={tongTien}>
      {loi ? (
        <p className="my-6 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          Không sinh được mã QR: {loi}
        </p>
      ) : (
        <>
          {anhQR ? (
            <img
              src={anhQR}
              alt="Mã QR chuyển khoản"
              className="mx-auto my-4 rounded-xl border border-slate-200"
            />
          ) : (
            <div className="mx-auto my-4 h-[280px] w-[280px] animate-pulse rounded-xl bg-slate-100" />
          )}

          {cauHinh && (
            <p className="so text-sm text-slate-600">
              {cauHinh.nganHangTen} · {cauHinh.soTaiKhoan}
              <br />
              <span className="font-semibold">{cauHinh.tenChuTk}</span>
            </p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            Nội dung chuyển khoản: <span className="so font-semibold">{maDonTam}</span>
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Chỉ bấm hoàn tất sau khi đã thấy tiền vào tài khoản.
          </p>
        </>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <button
          onClick={() => setBuoc('chon')}
          className="rounded-xl bg-slate-100 p-4 text-sm font-bold text-slate-700 hover:bg-slate-200"
        >
          Quay lại
        </button>
        <button
          onClick={() => void onDaNhanTien('CHUYEN_KHOAN', payload, cauHinh?.id ?? null)}
          disabled={!payload}
          className="rounded-xl bg-cyan-600 p-4 text-sm font-bold text-white hover:bg-cyan-700 disabled:bg-slate-300"
        >
          Đã nhận tiền, hoàn tất
        </button>
      </div>
    </Khung>
  );
}

function Khung({
  tieuDe,
  tongTien,
  children,
}: {
  tieuDe: string;
  tongTien: Dong;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-slate-300 bg-white p-6 text-center">
      <h3 className="text-lg font-bold text-slate-800">{tieuDe}</h3>
      <p className="so mt-2 text-2xl font-bold text-slate-900">Tổng thu: {dinhDangTien(tongTien)}</p>
      {children}
    </div>
  );
}
