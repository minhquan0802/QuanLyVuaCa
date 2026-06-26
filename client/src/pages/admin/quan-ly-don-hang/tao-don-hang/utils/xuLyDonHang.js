import { LOAI_KHACH_HANG, TRANG_THAI_DON_HANG } from "../constants.js";

export const laKhachLe = (customerType) => customerType === LOAI_KHACH_HANG.LE;

export const laKhachSi = (customerType) => customerType === LOAI_KHACH_HANG.SI;

export const layTrangThaiDonHangBanDau = (customerType) => {
  return laKhachLe(customerType)
    ? TRANG_THAI_DON_HANG.DA_THANH_TOAN
    : TRANG_THAI_DON_HANG.DANG_DONG_HANG;
};

export const layNhanNutTaoDon = (customerType) => {
  return laKhachSi(customerType) ? "Đặt đơn hàng" : "Hoàn tất xuất hóa đơn";
};

export const taoPayloadDonHang = ({ customerType, newOrder, customers }) => {
  const isKhachLe = laKhachLe(customerType);
  const selectedSi = customers.find(
    (c) => c.idtaikhoan === newOrder.idthongtinkhachhang,
  );

  return {
    idthongtinkhachhang: isKhachLe ? null : newOrder.idthongtinkhachhang,
    tenKhachHang: isKhachLe
      ? newOrder.tenKhachLe
      : `${selectedSi?.ho} ${selectedSi?.ten}`,
    sdtKhachHang: isKhachLe ? newOrder.sdtKhachLe : selectedSi?.sodienthoai,
    // Khách lẻ: trả tiền tại chỗ, giao dịch xong ngay -> DA_THANH_TOAN.
    // Khách sỉ: thanh toán sau, hàng chuyển sang quy trình đóng hàng -> DANG_DONG_HANG.
    trangthaidonhang: layTrangThaiDonHangBanDau(customerType),
    ghichu: "[POS]",
    chiTietDonHang: newOrder.items.map((item) => ({
      idchitietcaban: item.repoId,
      iddonvitinh: item.unitId,
      soluong: item.quantity,
      soluongkgthucte: item.estimatedKg,
      soluongkgthuctequydoi: item.estimatedKg,
      tongtiendukien: item.total,
      tongtienthucte: item.total,
    })),
  };
};
