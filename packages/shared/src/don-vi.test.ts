import { describe, expect, it } from 'vitest';
import {
  gramSangKg,
  kgSangGram,
  soKgTinhTien,
  tinhSoKgDuKien,
  tinhThanhTien,
  toPhanNghin,
} from './don-vi.js';

describe('tinhSoKgDuKien', () => {
  it('5 thùng × 25 kg/thùng = 125 kg', () => {
    expect(tinhSoKgDuKien(toPhanNghin(5), toPhanNghin(25))).toBe(kgSangGram(125));
  });

  it('nhận số lượng lẻ', () => {
    expect(tinhSoKgDuKien(toPhanNghin(2.5), toPhanNghin(25))).toBe(kgSangGram(62.5));
  });

  it('20 con × 0,8 kg/con = 16 kg', () => {
    expect(tinhSoKgDuKien(toPhanNghin(20), toPhanNghin(0.8))).toBe(kgSangGram(16));
  });

  it('đơn vị kg thì hệ số = 1, số lượng chính là số kg', () => {
    expect(tinhSoKgDuKien(toPhanNghin(30), toPhanNghin(1))).toBe(kgSangGram(30));
  });

  it('hệ số 0 trả về 0 để giao diện mở ô nhập tay', () => {
    expect(tinhSoKgDuKien(toPhanNghin(5), 0)).toBe(0);
  });
});

describe('tinhThanhTien', () => {
  it('125 kg × 32.500 đ/kg = 4.062.500 đ', () => {
    expect(tinhThanhTien(kgSangGram(125), 32_500)).toBe(4_062_500);
  });

  it('làm tròn tới đồng, không để lại số lẻ', () => {
    // 0,333 kg × 1.000 đ/kg = 333 đ
    expect(tinhThanhTien(333, 1000)).toBe(333);
    expect(Number.isInteger(tinhThanhTien(12_345, 33_333))).toBe(true);
  });

  it('không dính sai số dấu phẩy động', () => {
    // 0,1 kg + 0,2 kg phải đúng bằng 0,3 kg khi tính tiền
    const tong = kgSangGram(0.1) + kgSangGram(0.2);
    expect(tong).toBe(kgSangGram(0.3));
    expect(tinhThanhTien(tong, 10_000)).toBe(3000);
  });
});

describe('soKgTinhTien', () => {
  it('lấy số cân lại khi có', () => {
    expect(soKgTinhTien(kgSangGram(125), kgSangGram(123.4))).toBe(kgSangGram(123.4));
  });

  it('lấy số dự kiến khi chưa cân lại', () => {
    expect(soKgTinhTien(kgSangGram(125), null)).toBe(kgSangGram(125));
    expect(soKgTinhTien(kgSangGram(125), 0)).toBe(kgSangGram(125));
  });
});

describe('quy đổi qua lại', () => {
  it('kg -> gram -> kg không mất mát', () => {
    for (const kg of [0.001, 1, 32.5, 125.75, 1000]) {
      expect(gramSangKg(kgSangGram(kg))).toBe(kg);
    }
  });
});
