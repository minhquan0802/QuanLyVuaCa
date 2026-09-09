import { describe, expect, it } from 'vitest';
import {
  apBanSua,
  chenhLechThanhToan,
  gopDongHang,
  suyRaTrangThaiDong,
  taoDongHang,
  tinhLaiTongDon,
} from './don-hang.js';
import { kgSangGram, toPhanNghin } from './don-vi.js';
import type { ChiTietDonHang, DonHangDayDu } from './kieu.js';

function dong(p: Partial<ChiTietDonHang> & { id: string }): ChiTietDonHang {
  return {
    donHangId: 'don-1',
    sanPhamId: 'sp-1',
    loaiCaTen: 'Cá điêu hồng',
    sizeCaTen: 'Size 1',
    donViTinhId: 'dv-thung',
    donViTen: 'Thùng',
    heSoKg: toPhanNghin(25),
    soLuong: toPhanNghin(5),
    soKgDuKien: kgSangGram(125),
    soKgThucTe: null,
    donGia: 32_500,
    giaSuaTay: false,
    bangGiaId: 'bg-1',
    thanhTien: 4_062_500,
    ghiChu: null,
    thuTu: 0,
    daDong: false,
    dongLuc: null,
    ...p,
  };
}

function donHang(chiTiet: ChiTietDonHang[], p: Partial<DonHangDayDu> = {}): DonHangDayDu {
  const { tongTien, tongKg } = tinhLaiTongDon(chiTiet);
  return {
    id: 'don-1',
    maDon: 'POS-20260909-0007',
    nguon: 'POS',
    khachHangId: 'kh-1',
    khachTen: 'Chị Hoa',
    khachSdt: '0912345678',
    khachDiaChi: null,
    nhomGiaId: 'ng-si-xa',
    nhomGiaTen: 'Sỉ ở xa',
    laSi: true,
    nhomGiaSuaTay: false,
    tongTien,
    tongKg,
    trangThai: 'DA_XAC_NHAN',
    trangThaiDong: 'CHO_DONG',
    trangThaiTt: 'CHUA_TRA',
    hinhThucTt: null,
    soTienDaNhan: 0,
    cauHinhQrId: null,
    qrPayload: null,
    ghiChu: null,
    lyDoHuy: null,
    ngayBan: '2026-09-09',
    datLuc: '2026-09-09T08:42:00+07:00',
    xacNhanLuc: '2026-09-09T08:42:00+07:00',
    batDauDongLuc: null,
    dongXongLuc: null,
    hoanTatLuc: null,
    lanSuaCuoi: null,
    soLanSua: 0,
    chiTiet,
    ...p,
  };
}

describe('suyRaTrangThaiDong', () => {
  it('đơn lẻ luôn là KHONG_CAN', () => {
    expect(suyRaTrangThaiDong([dong({ id: 'a', daDong: true })], false)).toBe('KHONG_CAN');
  });

  it('chưa tick dòng nào -> CHO_DONG', () => {
    expect(suyRaTrangThaiDong([dong({ id: 'a' }), dong({ id: 'b' })], true)).toBe('CHO_DONG');
  });

  it('tick một phần -> DANG_DONG', () => {
    expect(
      suyRaTrangThaiDong([dong({ id: 'a', daDong: true }), dong({ id: 'b' })], true),
    ).toBe('DANG_DONG');
  });

  it('tick hết -> DA_DONG', () => {
    expect(
      suyRaTrangThaiDong([dong({ id: 'a', daDong: true }), dong({ id: 'b', daDong: true })], true),
    ).toBe('DA_DONG');
  });
});

describe('apBanSua', () => {
  it('tính lại tổng tiền và tổng kg', () => {
    const cu = donHang([dong({ id: 'a' })]);
    const sau = apBanSua(cu, [
      dong({ id: 'a', soLuong: toPhanNghin(2), soKgDuKien: kgSangGram(50) }),
    ]);

    expect(sau.tongKg).toBe(kgSangGram(50));
    expect(sau.tongTien).toBe(50 * 32_500);
  });

  it('FR-SD-05: đổi số lượng dòng đã đóng thì dòng đó quay lại chưa đóng', () => {
    const cu = donHang([dong({ id: 'a', daDong: true }), dong({ id: 'b', daDong: true })], {
      trangThaiDong: 'DA_DONG',
    });

    const sau = apBanSua(cu, [
      dong({ id: 'a', daDong: true, soLuong: toPhanNghin(9), soKgDuKien: kgSangGram(225) }),
      dong({ id: 'b', daDong: true }),
    ]);

    expect(sau.chiTiet[0]!.daDong).toBe(false);
    expect(sau.chiTiet[1]!.daDong).toBe(true);
    expect(sau.trangThaiDong).toBe('DANG_DONG');
    expect(sau.dongXongLuc).toBeNull();
  });

  it('sửa số kg cân lại KHÔNG làm mất dấu đã đóng', () => {
    // Cân lại chính là việc làm trong lúc đóng hàng, không phải sửa nội dung đơn
    const cu = donHang([dong({ id: 'a', daDong: true })], { trangThaiDong: 'DA_DONG' });
    const sau = apBanSua(cu, [
      dong({ id: 'a', daDong: true, soKgThucTe: kgSangGram(123.4) }),
    ]);

    expect(sau.chiTiet[0]!.daDong).toBe(true);
    expect(sau.trangThaiDong).toBe('DA_DONG');
    expect(sau.tongKg).toBe(kgSangGram(123.4));
  });

  it('thêm dòng mới vào đơn đã đóng xong thì đơn tụt về DANG_DONG', () => {
    const cu = donHang([dong({ id: 'a', daDong: true })], { trangThaiDong: 'DA_DONG' });
    const sau = apBanSua(cu, [dong({ id: 'a', daDong: true }), dong({ id: 'moi' })]);

    expect(sau.trangThaiDong).toBe('DANG_DONG');
    expect(sau.chiTiet[1]!.daDong).toBe(false);
  });

  it('đếm số lần sửa', () => {
    const cu = donHang([dong({ id: 'a' })], { soLanSua: 3 });
    expect(apBanSua(cu, [dong({ id: 'a' })]).soLanSua).toBe(4);
  });

  it('xoá dòng thì tổng giảm theo', () => {
    const cu = donHang([dong({ id: 'a' }), dong({ id: 'b' })]);
    const sau = apBanSua(cu, [dong({ id: 'a' })]);
    expect(sau.chiTiet).toHaveLength(1);
    expect(sau.tongTien).toBe(4_062_500);
  });
});

describe('chenhLechThanhToan', () => {
  it('sửa đơn làm tăng tiền -> khách còn thiếu', () => {
    const d = donHang([dong({ id: 'a' })], { soTienDaNhan: 4_062_500, trangThaiTt: 'DA_TRA' });
    const sau = apBanSua(d, [
      dong({ id: 'a', soLuong: toPhanNghin(6), soKgDuKien: kgSangGram(150) }),
    ]);
    expect(chenhLechThanhToan({ ...sau, soTienDaNhan: 4_062_500 })).toBeLessThan(0);
  });

  it('sửa đơn làm giảm tiền -> khách trả thừa', () => {
    const d = donHang([dong({ id: 'a' })], { soTienDaNhan: 4_062_500, trangThaiTt: 'DA_TRA' });
    const sau = apBanSua(d, [
      dong({ id: 'a', soLuong: toPhanNghin(4), soKgDuKien: kgSangGram(100) }),
    ]);
    expect(chenhLechThanhToan({ ...sau, soTienDaNhan: 4_062_500 })).toBeGreaterThan(0);
  });

  it('không đổi thì chênh lệch bằng 0', () => {
    const d = donHang([dong({ id: 'a' })], { soTienDaNhan: 4_062_500, trangThaiTt: 'DA_TRA' });
    expect(chenhLechThanhToan(d)).toBe(0);
  });
});

describe('taoDongHang', () => {
  const sp = { id: 'sp-1', loaiCaTen: 'Cá điêu hồng', sizeCaTen: 'Size 1' };
  const thung = { id: 'dv-thung', ten: 'Thùng', heSoKg: toPhanNghin(25) };
  const bao = { id: 'dv-bao', ten: 'Bao', heSoKg: 0 };

  it('quy đổi kg từ hệ số của đơn vị tính', () => {
    const d = taoDongHang({
      id: 'a', donHangId: 'don-1', thuTu: 0,
      sanPham: sp, donVi: thung, soLuong: toPhanNghin(5), donGia: 32_500,
    });
    expect(d.soKgDuKien).toBe(kgSangGram(125));
    expect(d.thanhTien).toBe(125 * 32_500);
  });

  it('hệ số 0 thì lấy số kg người nhập', () => {
    const d = taoDongHang({
      id: 'a', donHangId: 'don-1', thuTu: 0,
      sanPham: sp, donVi: bao, soLuong: toPhanNghin(1),
      soKgTuNhap: kgSangGram(37.5), donGia: 32_500,
    });
    expect(d.soKgDuKien).toBe(kgSangGram(37.5));
  });

  it('chụp lại hệ số quy đổi để đơn cũ không đổi khi sửa đơn vị tính', () => {
    const d = taoDongHang({
      id: 'a', donHangId: 'don-1', thuTu: 0,
      sanPham: sp, donVi: thung, soLuong: toPhanNghin(1), donGia: 1000,
    });
    expect(d.heSoKg).toBe(toPhanNghin(25));
  });
});

describe('gopDongHang', () => {
  const sp = { id: 'sp-1', loaiCaTen: 'Cá điêu hồng', sizeCaTen: 'Size 1' };
  const thung = { id: 'dv-thung', ten: 'Thùng', heSoKg: toPhanNghin(25) };
  const kg = { id: 'dv-kg', ten: 'Kg', heSoKg: toPhanNghin(1) };
  const tao = (id: string, dv: typeof thung, sl: number) =>
    taoDongHang({
      id, donHangId: 'don-1', thuTu: 0,
      sanPham: sp, donVi: dv, soLuong: toPhanNghin(sl), donGia: 32_500,
    });

  it('FR-DH-10: trùng (sản phẩm, đơn vị tính) thì cộng dồn', () => {
    const ra = gopDongHang([tao('a', thung, 5)], tao('b', thung, 2));
    expect(ra).toHaveLength(1);
    expect(ra[0]!.soLuong).toBe(toPhanNghin(7));
    expect(ra[0]!.soKgDuKien).toBe(kgSangGram(175));
    expect(ra[0]!.thanhTien).toBe(175 * 32_500);
  });

  it('khác đơn vị tính thì tạo dòng riêng', () => {
    const ra = gopDongHang([tao('a', thung, 5)], tao('b', kg, 30));
    expect(ra).toHaveLength(2);
  });

  it('cộng thêm hàng vào dòng đã đóng thì dòng đó phải đóng lại', () => {
    const cu = { ...tao('a', thung, 5), daDong: true, dongLuc: '2026-09-09T09:00:00+07:00' };
    const ra = gopDongHang([cu], tao('b', thung, 1));
    expect(ra[0]!.daDong).toBe(false);
    expect(ra[0]!.dongLuc).toBeNull();
  });
});
