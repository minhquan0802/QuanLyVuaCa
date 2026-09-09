/**
 * Nguồn dữ liệu — lớp trừu tượng giữa giao diện và nơi chứa dữ liệu.
 *
 * Kiến trúc đã chốt: MỘT giao diện, NHIỀU nguồn dữ liệu (KIEN-TRUC.md).
 *   NguonBoNho  — tạm thời, chạy trong trình duyệt khi đang dựng giao diện
 *   NguonSQLite — máy quầy, qua tauri-plugin-sql (làm khi đã cài Rust)
 *   NguonHTTP   — trang web chỉ đọc trên Host
 *
 * Giao diện KHÔNG được gọi thẳng SQLite hay fetch. Mọi truy cập dữ liệu đi
 * qua interface này, nên thay nguồn không phải sửa một dòng giao diện nào.
 */

import type {
  BanGhiSuaDon,
  CauHinhQR,
  ChiTietDonHang,
  DonHangDayDu,
  DonViTinh,
  Gia,
  Gram,
  KhachHang,
  NhomGia,
  SanPham,
  ThongKeNgay,
} from '@vuaca/shared';

/** Một ô trong bảng nhập giá hàng loạt. */
export interface OGia {
  sanPhamId: string;
  nhomGiaId: string;
  gia: number;
}

export interface NguonDuLieu {
  // --- Danh mục ---
  layNhomGia(): Promise<NhomGia[]>;
  layDonViTinh(): Promise<DonViTinh[]>;
  laySanPham(): Promise<SanPham[]>;
  layCauHinhQR(): Promise<CauHinhQR | null>;

  // --- Nhóm giá (FR-NG-02, 03, 04) ---
  themNhomGia(n: Omit<NhomGia, 'id'>): Promise<NhomGia>;
  suaNhomGia(id: string, sua: Partial<Omit<NhomGia, 'id'>>): Promise<void>;
  /** Ném lỗi nếu còn khách đang thuộc nhóm, hoặc nhóm đang là mặc định. */
  xoaNhomGia(id: string): Promise<void>;

  // --- Bảng giá ---
  /** Giá đang hiệu lực hôm nay cho mọi cặp (sản phẩm, nhóm giá). */
  layGiaHienHanh(): Promise<Gia[]>;
  /** Giá hiệu lực của một ngày bất kỳ. */
  layGiaNgay(ngay: string): Promise<Gia[]>;
  /** Ngày gần nhất TRƯỚC `ngay` có bảng giá — dùng cho nút "chép giá hôm qua". */
  layNgayCoGiaTruoc(ngay: string): Promise<string | null>;
  /** Ghi đè toàn bộ bảng giá của một ngày (FR-DM-07). */
  luuBangGia(ngay: string, o: OGia[]): Promise<void>;

  // --- Khách hàng (FR-KH-01) ---
  layKhachHang(): Promise<KhachHang[]>;
  themKhachHang(k: Omit<KhachHang, 'id'>): Promise<KhachHang>;
  suaKhachHang(id: string, sua: Partial<Omit<KhachHang, 'id'>>): Promise<void>;
  /** Xoá mềm — đơn cũ giữ nguyên thông tin đã chụp lại (FR-KH-04). */
  xoaKhachHang(id: string): Promise<void>;

  // --- Đơn hàng ---
  luuDon(don: DonHangDayDu): Promise<void>;
  layDon(id: string): Promise<DonHangDayDu | null>;
  layDonTheoNgay(ngayBan: string): Promise<DonHangDayDu[]>;
  /** Toàn bộ đơn đang CHO_DONG hoặc DANG_DONG — FR-DG-03. */
  layBangDongHang(): Promise<DonHangDayDu[]>;
  /** Đơn chưa hoàn tất của một khách — dùng cho cảnh báo FR-SD-10. */
  layDonChuaXongCuaKhach(khachHangId: string): Promise<DonHangDayDu[]>;
  /** Số thứ tự tiếp theo trong ngày, để sinh mã đơn. */
  soThuTuTiepTheo(ngayBan: string): Promise<number>;

  // --- Sửa đơn (FR-SD) ---
  /**
   * Áp bản sửa lên đơn, tính lại tổng tiền và trạng thái đóng hàng, đồng thời
   * lưu bản chụp trước/sau. Lý do là bắt buộc — không có lý do thì ném lỗi.
   */
  suaDon(
    donId: string,
    chiTietMoi: ChiTietDonHang[],
    lyDo: string,
    nguoiDungId?: string | null,
  ): Promise<DonHangDayDu>;
  huyDon(donId: string, lyDo: string, nguoiDungId?: string | null): Promise<void>;
  layLichSuSuaDon(donId: string): Promise<BanGhiSuaDon[]>;

  // --- Đóng hàng ---
  datTrangThaiDong(donId: string, dongId: string, daDong: boolean): Promise<void>;
  datKgThucTe(donId: string, dongId: string, gram: Gram | null): Promise<void>;

  // --- Thống kê ---
  thongKe(ngayBan: string): Promise<ThongKeNgay>;
}
