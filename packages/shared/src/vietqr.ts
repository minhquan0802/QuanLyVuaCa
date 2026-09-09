/**
 * Sinh chuỗi thanh toán VietQR theo chuẩn EMVCo — đặc tả đầy đủ ở
 * docs/pos/VIETQR.md.
 *
 * Chạy hoàn toàn cục bộ: không gọi API, không cần Internet. Đây là điều kiện
 * để quầy vẫn nhận chuyển khoản khi mất mạng (FR-TT-05).
 */

import type { Dong } from './don-vi.js';

/** GUID của NAPAS trong trường 38, luôn cố định. */
const GUID_NAPAS = 'A000000727';
/** Chuyển tới tài khoản. Dùng 'QRIBFTTC' nếu chuyển tới thẻ. */
const DICH_VU_CHUYEN_TAI_KHOAN = 'QRIBFTTA';
/** VND theo ISO 4217. */
const MA_TIEN_VND = '704';
const MA_QUOC_GIA = 'VN';

/** QR tĩnh: khách tự nhập số tiền. */
const KHOI_TAO_TINH = '11';
/** QR động: đã có sẵn số tiền. */
const KHOI_TAO_DONG = '12';

/**
 * Một bộ Tag-Length-Value. Độ dài chỉ có 2 chữ số nên giá trị tối đa 99 ký tự.
 */
function tlv(tag: string, giaTri: string): string {
  if (giaTri.length > 99) {
    throw new Error(`VietQR: trường ${tag} dài ${giaTri.length} ký tự, tối đa 99`);
  }
  return tag + String(giaTri.length).padStart(2, '0') + giaTri;
}

/**
 * CRC-16/CCITT-FALSE: đa thức 0x1021, khởi tạo 0xFFFF, không đảo bit đầu vào
 * hay đầu ra, không XOR cuối. Tính trên toàn bộ chuỗi KỂ CẢ bốn ký tự '6304'.
 *
 * Sai một trong các chi tiết trên là điện thoại báo "mã QR không hợp lệ".
 */
export function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Chuẩn hoá nội dung chuyển khoản: bỏ dấu, viết hoa, chỉ giữ A-Z 0-9 và
 * khoảng trắng, cắt còn 25 ký tự.
 *
 * Nhiều ngân hàng cắt bỏ hoặc từ chối ký tự có dấu và ký tự đặc biệt.
 */
export function chuanHoaNoiDung(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 25)
    .trim();
}

export interface ThamSoQR {
  /** Mã BIN 6 chữ số của ngân hàng nhận, ví dụ '970436' = Vietcombank. */
  binNganHang: string;
  /** Số tài khoản nhận. */
  soTaiKhoan: string;
  /** Số tiền, đơn vị đồng. Bỏ trống hoặc 0 -> sinh QR tĩnh. */
  soTien?: Dong;
  /** Nội dung chuyển khoản, thường là mã đơn. Sẽ được chuẩn hoá. */
  noiDung?: string;
}

/**
 * Sinh chuỗi payload VietQR. Đem chuỗi này vẽ thành ảnh bằng thư viện QR bất
 * kỳ, mức sửa lỗi M, cỡ tối thiểu 250×250 px.
 */
export function taoPayloadVietQR(t: ThamSoQR): string {
  if (!/^\d{6}$/.test(t.binNganHang)) {
    throw new Error(`VietQR: mã BIN phải là 6 chữ số, nhận được "${t.binNganHang}"`);
  }
  if (!/^\d{1,19}$/.test(t.soTaiKhoan)) {
    throw new Error(`VietQR: số tài khoản không hợp lệ "${t.soTaiKhoan}"`);
  }

  // Trường 38 sub-tag 01 là MỘT TEMPLATE LỒNG chứa BIN và số tài khoản,
  // không phải BIN đặt trực tiếp. Đây là chỗ hay bị làm sai nhất.
  const nguoiNhan = tlv('00', t.binNganHang) + tlv('01', t.soTaiKhoan);

  const thongTinNhan =
    tlv('00', GUID_NAPAS) + tlv('01', nguoiNhan) + tlv('02', DICH_VU_CHUYEN_TAI_KHOAN);

  const qrDong = t.soTien != null && t.soTien > 0;
  const noiDung = t.noiDung ? chuanHoaNoiDung(t.noiDung) : '';

  // Các tag phải xếp theo thứ tự tăng dần: 00, 01, 38, 53, 54, 58, 62, 63
  let payload =
    tlv('00', '01') +
    tlv('01', qrDong ? KHOI_TAO_DONG : KHOI_TAO_TINH) +
    tlv('38', thongTinNhan) +
    tlv('53', MA_TIEN_VND) +
    (qrDong ? tlv('54', String(Math.round(t.soTien!))) : '') +
    tlv('58', MA_QUOC_GIA) +
    (noiDung ? tlv('62', tlv('08', noiDung)) : '');

  payload += '6304'; // tag + length của CRC, tính luôn vào phần băm
  return payload + crc16(payload);
}

/** Mã BIN của các ngân hàng hay gặp. Danh sách đầy đủ nên đưa vào CSDL. */
export const BIN_NGAN_HANG: Readonly<Record<string, string>> = {
  VIETCOMBANK: '970436',
  VIETINBANK: '970415',
  BIDV: '970418',
  AGRIBANK: '970405',
  TECHCOMBANK: '970407',
  MB: '970422',
  ACB: '970416',
  SACOMBANK: '970403',
  VPBANK: '970432',
  TPBANK: '970423',
};
