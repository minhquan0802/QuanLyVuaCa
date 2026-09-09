/**
 * Kiểu dữ liệu dùng chung giữa máy quầy và Host.
 * Ánh xạ 1-1 với docs/pos/schema-client.sql — mọi con số đều là số nguyên
 * theo quy ước ở don-vi.ts.
 */

import type { Dong, Gram, PhanNghin } from './don-vi.js';

export const TRANG_THAI_DON = ['NHAP', 'DA_XAC_NHAN', 'HOAN_TAT', 'DA_HUY'] as const;
export type TrangThaiDon = (typeof TRANG_THAI_DON)[number];

export const TRANG_THAI_DONG = ['KHONG_CAN', 'CHO_DONG', 'DANG_DONG', 'DA_DONG'] as const;
export type TrangThaiDong = (typeof TRANG_THAI_DONG)[number];

export const TRANG_THAI_TT = ['CHUA_TRA', 'DA_TRA'] as const;
export type TrangThaiTT = (typeof TRANG_THAI_TT)[number];

export const HINH_THUC_TT = ['TIEN_MAT', 'CHUYEN_KHOAN'] as const;
export type HinhThucTT = (typeof HINH_THUC_TT)[number];

export type NguonDon = 'POS' | 'WEB';
export type VaiTro = 'QUAN_TRI' | 'NHAN_VIEN';

/** Một bậc giá. Cờ `laSi` quyết định đơn có phải qua bước đóng hàng không. */
export interface NhomGia {
  id: string;
  ma: string;
  ten: string;
  laSi: boolean;
  thuTu: number;
  laMacDinh: boolean;
}

/** `heSoKg` = 0 nghĩa là không quy đổi được, nhân viên nhập số kg bằng tay. */
export interface DonViTinh {
  id: string;
  ma: string;
  ten: string;
  heSoKg: PhanNghin;
}

export interface SanPham {
  id: string;
  maSku: string;
  loaiCaId: string;
  loaiCaTen: string;
  sizeCaTen: string;
  thuTuSize: number;
  donViMacDinhId: string | null;
}

/** Giá MỖI KG của một sản phẩm cho một nhóm giá, đang hiệu lực hôm nay. */
export interface Gia {
  sanPhamId: string;
  nhomGiaId: string;
  bangGiaId: string;
  gia: Dong;
}

export interface KhachHang {
  id: string;
  ma: string | null;
  hoTen: string;
  soDienThoai: string | null;
  diaChi: string | null;
  nhomGiaId: string;
  ghiChu: string | null;
}

export interface CauHinhQR {
  id: string;
  tenGoiNho: string;
  nganHangBin: string;
  nganHangMa: string;
  nganHangTen: string;
  soTaiKhoan: string;
  tenChuTk: string;
  dangDung: boolean;
}

export interface ChiTietDonHang {
  id: string;
  donHangId: string;
  sanPhamId: string;

  /** Ảnh chụp lúc đặt — in lại phiếu sau 2 năm vẫn ra đúng nội dung. */
  loaiCaTen: string;
  sizeCaTen: string;
  donViTinhId: string | null;
  donViTen: string;
  /** Chụp lại: sửa "thùng" từ 25kg thành 30kg thì đơn cũ vẫn giữ 25. */
  heSoKg: PhanNghin;

  /** Số lượng theo đơn vị tính. `5` thùng -> `5000`. */
  soLuong: PhanNghin;
  /** `soLuong × heSoKg`, tự tính lúc đặt. */
  soKgDuKien: Gram;
  /** Cân lại lúc đóng hàng. `null` = chưa cân lại. */
  soKgThucTe: Gram | null;

  /** Đơn giá MỖI KG, đóng băng lúc thêm vào đơn. */
  donGia: Dong;
  giaSuaTay: boolean;
  bangGiaId: string | null;
  thanhTien: Dong;

  ghiChu: string | null;
  thuTu: number;

  daDong: boolean;
  dongLuc: string | null;
}

export interface DonHang {
  id: string;
  maDon: string;
  nguon: NguonDon;

  khachHangId: string | null;
  khachTen: string | null;
  khachSdt: string | null;
  khachDiaChi: string | null;

  nhomGiaId: string;
  nhomGiaTen: string;
  laSi: boolean;
  nhomGiaSuaTay: boolean;

  tongTien: Dong;
  tongKg: Gram;

  trangThai: TrangThaiDon;
  trangThaiDong: TrangThaiDong;
  trangThaiTt: TrangThaiTT;
  hinhThucTt: HinhThucTT | null;
  soTienDaNhan: Dong;
  cauHinhQrId: string | null;
  qrPayload: string | null;

  ghiChu: string | null;
  lyDoHuy: string | null;

  /** Ngày làm việc của vựa, `YYYY-MM-DD`. Không suy ra từ `datLuc`. */
  ngayBan: string;
  datLuc: string;
  xacNhanLuc: string | null;
  batDauDongLuc: string | null;
  dongXongLuc: string | null;
  hoanTatLuc: string | null;

  lanSuaCuoi: string | null;
  soLanSua: number;
}

/** Một đơn kèm các dòng hàng của nó. */
export interface DonHangDayDu extends DonHang {
  chiTiet: ChiTietDonHang[];
}

/**
 * Vết một lần sửa đơn — FR-SD-03.
 * Lưu bản chụp toàn bộ đơn trước và sau. Đây là thứ duy nhất giúp đối chiếu
 * khi có sai sót, nên bắt buộc phải có lý do.
 */
export interface BanGhiSuaDon {
  id: string;
  donHangId: string;
  nguoiDungId: string | null;
  lyDo: string;
  trangThaiLucSua: TrangThaiDon;
  trangThaiDongLucSua: TrangThaiDong;
  truoc: DonHangDayDu;
  sau: DonHangDayDu;
  tongTienTruoc: Dong;
  tongTienSau: Dong;
  suaLuc: string;
}

/** Số liệu tổng hợp một ngày — FR-TK-02. */
export interface ThongKeNgay {
  ngayBan: string;
  soDon: number;
  tongDoanhThu: Dong;
  tongKgDaBan: Gram;
  soDonSi: number;
  soDonLe: number;
  thuTienMat: Dong;
  thuChuyenKhoan: Dong;
  chuaThu: Dong;
  soDonHuy: number;
}
