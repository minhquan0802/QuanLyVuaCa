import { describe, expect, it } from 'vitest';
import { BIN_NGAN_HANG, chuanHoaNoiDung, crc16, taoPayloadVietQR } from './vietqr.js';

describe('crc16', () => {
  it('khớp giá trị kiểm tra chuẩn của CRC-16/CCITT-FALSE', () => {
    // Vector kiểm tra chính thức: CRC của "123456789" là 0x29B1
    expect(crc16('123456789')).toBe('29B1');
  });

  it('luôn trả về đúng 4 ký tự hex viết hoa', () => {
    for (const s of ['', 'a', 'POS-20260909-0007', 'x'.repeat(500)]) {
      expect(crc16(s)).toMatch(/^[0-9A-F]{4}$/);
    }
  });
});

describe('taoPayloadVietQR', () => {
  // Chuỗi thật đã giải mã trong docs/pos/VIETQR.md §2
  const BIN_VCB = '970436';
  const TK_VCB = '0881000458086';

  it('dựng trường 38 đúng cấu trúc lồng của NAPAS', () => {
    const payload = taoPayloadVietQR({ binNganHang: BIN_VCB, soTaiKhoan: TK_VCB });

    // 38 | 57 | 0010A000000727 | 0127 0006970436 0113 0881000458086 | 0208QRIBFTTA
    expect(payload).toContain(
      '38570010A00000072701270006970436011308810004580860208QRIBFTTA',
    );
  });

  it('sinh QR tĩnh khi không truyền số tiền', () => {
    const payload = taoPayloadVietQR({ binNganHang: BIN_VCB, soTaiKhoan: TK_VCB });

    expect(payload.startsWith('000201')).toBe(true);
    expect(payload).toContain('010211'); // point of initiation = 11 (tĩnh)
    expect(giaiMaTLV(payload)['54']).toBeUndefined(); // không có trường số tiền
  });

  it('sinh QR động khi có số tiền', () => {
    const payload = taoPayloadVietQR({
      binNganHang: BIN_NGAN_HANG.MB!,
      soTaiKhoan: '0123456789',
      soTien: 1_234_500,
      noiDung: 'POS 20260909 0007',
    });

    expect(payload).toContain('010212'); // point of initiation = 12 (động)
    expect(payload).toContain('54071234500'); // tag 54, dài 7, giá trị 1234500
    expect(payload).toContain('5303704'); // VND
    expect(payload).toContain('5802VN');
    // tag 62 bọc ngoài, bên trong là tag 08 dài 17 ký tự
    expect(payload).toContain('62210817POS 20260909 0007');
  });

  it('CRC nằm cuối chuỗi và kiểm lại được', () => {
    const payload = taoPayloadVietQR({
      binNganHang: BIN_VCB,
      soTaiKhoan: TK_VCB,
      soTien: 50_000,
    });

    expect(payload.slice(-8, -4)).toBe('6304');
    // Tính lại CRC trên phần trước nó phải ra đúng 4 ký tự cuối
    expect(crc16(payload.slice(0, -4))).toBe(payload.slice(-4));
  });

  it('mọi trường đều đọc lại được bằng bộ giải mã TLV độc lập', () => {
    const payload = taoPayloadVietQR({
      binNganHang: BIN_VCB,
      soTaiKhoan: TK_VCB,
      soTien: 4_062_500,
      noiDung: 'POS 20260909 0007',
    });

    const truong = giaiMaTLV(payload);
    expect(truong['00']).toBe('01');
    expect(truong['01']).toBe('12');
    expect(truong['53']).toBe('704');
    expect(truong['54']).toBe('4062500');
    expect(truong['58']).toBe('VN');

    const t38 = giaiMaTLV(truong['38']!);
    expect(t38['00']).toBe('A000000727');
    expect(t38['02']).toBe('QRIBFTTA');

    const nguoiNhan = giaiMaTLV(t38['01']!);
    expect(nguoiNhan['00']).toBe(BIN_VCB);
    expect(nguoiNhan['01']).toBe(TK_VCB);
  });

  it('từ chối mã BIN và số tài khoản không hợp lệ', () => {
    expect(() => taoPayloadVietQR({ binNganHang: 'MB', soTaiKhoan: '123' })).toThrow(/BIN/);
    expect(() =>
      taoPayloadVietQR({ binNganHang: '970436', soTaiKhoan: 'abc' }),
    ).toThrow(/tài khoản/);
  });
});

describe('chuanHoaNoiDung', () => {
  it('bỏ dấu tiếng Việt và viết hoa', () => {
    expect(chuanHoaNoiDung('Thanh toán đơn hàng')).toBe('THANH TOAN DON HANG');
  });

  it('loại ký tự đặc biệt, gộp khoảng trắng', () => {
    expect(chuanHoaNoiDung('POS-20260909-0007')).toBe('POS 20260909 0007');
  });

  it('cắt còn tối đa 25 ký tự', () => {
    expect(chuanHoaNoiDung('A'.repeat(60))).toHaveLength(25);
  });
});

/** Bộ giải mã TLV độc lập, viết riêng cho kiểm thử. */
function giaiMaTLV(s: string): Record<string, string> {
  const ra: Record<string, string> = {};
  let i = 0;
  while (i + 4 <= s.length) {
    const tag = s.slice(i, i + 2);
    const len = Number(s.slice(i + 2, i + 4));
    ra[tag] = s.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return ra;
}
