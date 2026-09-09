/**
 * Dữ liệu mẫu để chạy thử.
 *
 * Dùng chung cho cả `NguonBoNho` (chạy trong trình duyệt) và `NguonSQLite`
 * (gieo lần đầu khi tệp pos.db còn trống), nên hai nơi luôn thấy cùng một
 * bộ danh mục.
 *
 * Khi đưa vào dùng thật: xoá tệp pos.db, mở lại ứng dụng, rồi nhập danh mục
 * thật ở màn hình Bảng giá và Khách hàng.
 */

import { toPhanNghin, type CauHinhQR, type DonViTinh, type Gia, type KhachHang, type NhomGia, type SanPham } from '@vuaca/shared';

const NHOM_GIA: NhomGia[] = [
  { id: 'ng-le', ma: 'LE', ten: 'Lẻ', laSi: false, thuTu: 1, laMacDinh: true },
  { id: 'ng-si-gan', ma: 'SI_GAN', ten: 'Sỉ ở gần', laSi: true, thuTu: 2, laMacDinh: false },
  { id: 'ng-si-xa', ma: 'SI_XA', ten: 'Sỉ ở xa', laSi: true, thuTu: 3, laMacDinh: false },
  { id: 'ng-si-vip', ma: 'SI_VIP', ten: 'Sỉ thân thiết', laSi: true, thuTu: 4, laMacDinh: false },
];

const DON_VI_TINH: DonViTinh[] = [
  { id: 'dv-kg', ma: 'KG', ten: 'Kg', heSoKg: toPhanNghin(1) },
  { id: 'dv-thung', ma: 'THUNG', ten: 'Thùng', heSoKg: toPhanNghin(25) },
  { id: 'dv-con', ma: 'CON', ten: 'Con', heSoKg: toPhanNghin(0.8) },
  // Hệ số 0 -> nhân viên nhập số kg bằng tay (FR-DH-07)
  { id: 'dv-bao', ma: 'BAO', ten: 'Bao (cân tay)', heSoKg: 0 },
];

const LOAI_CA = [
  { id: 'lc-dieu-hong', ten: 'Cá điêu hồng' },
  { id: 'lc-loc', ten: 'Cá lóc' },
  { id: 'lc-tra', ten: 'Cá tra' },
];
const SIZES = ['Size 1', 'Size 2', 'Size 3'];

const SAN_PHAM: SanPham[] = LOAI_CA.flatMap((lc, i) =>
  SIZES.map((sz, j) => ({
    id: `sp-${i}-${j}`,
    maSku: `${lc.id.slice(3, 8).toUpperCase()}-S${j + 1}`,
    loaiCaId: lc.id,
    loaiCaTen: lc.ten,
    sizeCaTen: sz,
    thuTuSize: j,
    donViMacDinhId: 'dv-kg',
  })),
);

const GIA_GOC = [52_000, 48_000, 45_000];
const HE_SO_NHOM: Record<string, number> = {
  'ng-le': 1,
  'ng-si-gan': 0.92,
  'ng-si-xa': 0.94,
  'ng-si-vip': 0.88,
};

const GIA: Gia[] = SAN_PHAM.flatMap((sp) =>
  NHOM_GIA.map((ng) => ({
    sanPhamId: sp.id,
    nhomGiaId: ng.id,
    bangGiaId: `bg-${sp.id}|${ng.id}`,
    gia: Math.round(((GIA_GOC[sp.thuTuSize] ?? 45_000) * (HE_SO_NHOM[ng.id] ?? 1)) / 500) * 500,
  })),
);

const KHACH_HANG: KhachHang[] = [
  { id: 'kh-hoa', ma: 'KH001', hoTen: 'Chị Hoa', soDienThoai: '0912345678', diaChi: 'Chợ Cái Răng', nhomGiaId: 'ng-si-xa', ghiChu: null },
  { id: 'kh-tuan', ma: 'KH002', hoTen: 'Anh Tuấn', soDienThoai: '0987654321', diaChi: 'Ninh Kiều', nhomGiaId: 'ng-si-gan', ghiChu: null },
  { id: 'kh-be-bay', ma: 'KH003', hoTen: 'Bé Bảy', soDienThoai: '0909111222', diaChi: 'Bình Thuỷ', nhomGiaId: 'ng-si-vip', ghiChu: 'Khách ruột, lấy hàng mỗi sáng' },
  { id: 'kh-hung', ma: 'KH004', hoTen: 'Chú Hưng', soDienThoai: '0933444555', diaChi: 'Phong Điền', nhomGiaId: 'ng-le', ghiChu: null },
];

const CAU_HINH_QR: CauHinhQR = {
  id: 'qr-1',
  tenGoiNho: 'MB — tài khoản chính',
  nganHangBin: '970422',
  nganHangMa: 'MB',
  nganHangTen: 'Ngân hàng Quân đội',
  soTaiKhoan: '0123456789',
  tenChuTk: 'NGUYEN VAN CHU VUA',
  dangDung: true,
};

export function duLieuMau() {
  return {
    nhomGia: structuredClone(NHOM_GIA),
    donVi: structuredClone(DON_VI_TINH),
    sanPham: structuredClone(SAN_PHAM),
    gia: structuredClone(GIA),
    khach: structuredClone(KHACH_HANG),
    cauHinhQR: structuredClone(CAU_HINH_QR),
  };
}
