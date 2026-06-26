export const tinhTongSoLuong = (listChiTiet) =>
  (listChiTiet || []).reduce((sum, ct) => sum + Number(ct.soluongthanhly), 0);

export const tinhTongTien = (listChiTiet) =>
  (listChiTiet || []).reduce((sum, ct) => sum + Number(ct.thanhtien), 0);

export const tenSanPham = (listChiTiet) => {
  const danhSachTen = [
    ...new Set(
      (listChiTiet || []).map((ct) => `${ct.tenLoaiCa} (${ct.tenSize})`),
    ),
  ];
  return danhSachTen.join(", ");
};
