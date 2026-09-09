/**
 * Tính lại đơn hàng — dùng chung máy quầy và Host để hai bên không bao giờ
 * ra hai con số khác nhau cho cùng một đơn.
 */

import {
  soKgTinhTien,
  tinhSoKgDuKien,
  tinhThanhTien,
  type Dong,
  type Gram,
  type PhanNghin,
} from './don-vi.js';
import type { ChiTietDonHang, DonHangDayDu, TrangThaiDong } from './kieu.js';

/**
 * Dựng một dòng hàng từ lựa chọn của nhân viên.
 *
 * Dùng chung cho màn hình đặt hàng và cho việc thêm dòng khi sửa đơn, để hai
 * chỗ không bao giờ tính ra hai kết quả khác nhau.
 *
 * `soKgTuNhap` chỉ dùng khi đơn vị tính có hệ số bằng 0 (không quy đổi được).
 */
export function taoDongHang(p: {
  id: string;
  donHangId: string;
  thuTu: number;
  sanPham: { id: string; loaiCaTen: string; sizeCaTen: string };
  donVi: { id: string; ten: string; heSoKg: PhanNghin };
  soLuong: PhanNghin;
  soKgTuNhap?: Gram;
  donGia: Dong;
  bangGiaId?: string | null;
  giaSuaTay?: boolean;
  ghiChu?: string | null;
}): ChiTietDonHang {
  const soKgDuKien =
    p.donVi.heSoKg > 0 ? tinhSoKgDuKien(p.soLuong, p.donVi.heSoKg) : (p.soKgTuNhap ?? 0);

  return {
    id: p.id,
    donHangId: p.donHangId,
    sanPhamId: p.sanPham.id,
    loaiCaTen: p.sanPham.loaiCaTen,
    sizeCaTen: p.sanPham.sizeCaTen,
    donViTinhId: p.donVi.id,
    donViTen: p.donVi.ten,
    heSoKg: p.donVi.heSoKg,
    soLuong: p.soLuong,
    soKgDuKien,
    soKgThucTe: null,
    donGia: p.donGia,
    giaSuaTay: p.giaSuaTay ?? false,
    bangGiaId: p.bangGiaId ?? null,
    thanhTien: tinhThanhTien(soKgDuKien, p.donGia),
    ghiChu: p.ghiChu ?? null,
    thuTu: p.thuTu,
    daDong: false,
    dongLuc: null,
  };
}

/**
 * Gộp một dòng mới vào danh sách đang có.
 * FR-DH-10: trùng (sản phẩm, đơn vị tính) thì cộng dồn, không tạo dòng mới.
 */
export function gopDongHang(
  danhSach: ChiTietDonHang[],
  moi: ChiTietDonHang,
): ChiTietDonHang[] {
  const cu = danhSach.find(
    (c) => c.sanPhamId === moi.sanPhamId && c.donViTinhId === moi.donViTinhId,
  );
  if (!cu) return [...danhSach, { ...moi, thuTu: danhSach.length }];

  return danhSach.map((c) =>
    c.id === cu.id
      ? tinhLaiDong({
          ...c,
          soLuong: c.soLuong + moi.soLuong,
          soKgDuKien: c.soKgDuKien + moi.soKgDuKien,
          // Dòng bị cộng thêm hàng thì phải đóng lại từ đầu
          daDong: false,
          dongLuc: null,
        })
      : c,
  );
}

/** Tính lại thành tiền của một dòng theo số kg đang có hiệu lực. */
export function tinhLaiDong(dong: ChiTietDonHang): ChiTietDonHang {
  const soKg = soKgTinhTien(dong.soKgDuKien, dong.soKgThucTe);
  return { ...dong, thanhTien: tinhThanhTien(soKg, dong.donGia) };
}

/** Tổng tiền và tổng kg của cả đơn. */
export function tinhLaiTongDon(chiTiet: ChiTietDonHang[]): { tongTien: Dong; tongKg: Gram } {
  return {
    tongTien: chiTiet.reduce((s, c) => s + c.thanhTien, 0),
    tongKg: chiTiet.reduce((s, c) => s + soKgTinhTien(c.soKgDuKien, c.soKgThucTe), 0),
  };
}

/**
 * Trạng thái đóng hàng suy ra từ các dòng.
 * Đơn không phải hàng sỉ thì giữ nguyên KHONG_CAN.
 */
export function suyRaTrangThaiDong(
  chiTiet: ChiTietDonHang[],
  laSi: boolean,
): TrangThaiDong {
  if (!laSi) return 'KHONG_CAN';
  if (chiTiet.length === 0) return 'CHO_DONG';
  if (chiTiet.every((c) => c.daDong)) return 'DA_DONG';
  if (chiTiet.some((c) => c.daDong)) return 'DANG_DONG';
  return 'CHO_DONG';
}

/** Một dòng có thay đổi phần ảnh hưởng tới việc đóng hàng hay không. */
export function dongDaDoi(cu: ChiTietDonHang | undefined, moi: ChiTietDonHang): boolean {
  if (!cu) return true; // dòng mới thêm
  return (
    cu.soLuong !== moi.soLuong ||
    cu.soKgDuKien !== moi.soKgDuKien ||
    cu.sanPhamId !== moi.sanPhamId ||
    cu.donViTinhId !== moi.donViTinhId
  );
}

/**
 * Áp bản sửa lên đơn và tính lại mọi thứ dẫn xuất.
 *
 * FR-SD-05: dòng nào bị đổi số lượng, đổi sản phẩm hay mới thêm thì **quay về
 * chưa đóng**, và đơn tụt trạng thái tương ứng. Sửa số kg cân lại KHÔNG làm
 * mất dấu đã đóng, vì cân lại chính là việc làm trong lúc đóng hàng.
 */
export function apBanSua(cu: DonHangDayDu, chiTietMoi: ChiTietDonHang[]): DonHangDayDu {
  const chiTiet = chiTietMoi.map((c, i) => {
    const truoc = cu.chiTiet.find((x) => x.id === c.id);
    const daDong = dongDaDoi(truoc, c) ? false : c.daDong;
    return tinhLaiDong({ ...c, thuTu: i, daDong, dongLuc: daDong ? c.dongLuc : null });
  });

  const { tongTien, tongKg } = tinhLaiTongDon(chiTiet);
  const trangThaiDong = suyRaTrangThaiDong(chiTiet, cu.laSi);

  return {
    ...cu,
    chiTiet,
    tongTien,
    tongKg,
    trangThaiDong,
    dongXongLuc: trangThaiDong === 'DA_DONG' ? (cu.dongXongLuc ?? new Date().toISOString()) : null,
    soLanSua: cu.soLanSua + 1,
  };
}

/**
 * Chênh lệch tiền sau khi sửa đơn đã thu tiền — FR-SD-04.
 * Dương = khách đã trả thừa, âm = khách còn thiếu.
 */
export function chenhLechThanhToan(don: DonHangDayDu): Dong {
  return don.soTienDaNhan - don.tongTien;
}
