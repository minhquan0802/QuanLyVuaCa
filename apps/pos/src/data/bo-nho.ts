/**
 * Nguồn dữ liệu tạm chạy trong bộ nhớ trình duyệt.
 *
 * Chỉ để dựng và thử giao diện khi chưa cài được Rust/Tauri. Dữ liệu mất khi
 * tải lại trang. Khi có Tauri thì viết `NguonSQLite` cài cùng interface
 * `NguonDuLieu` rồi đổi một dòng ở `src/data/index.ts` — giao diện giữ nguyên.
 *
 * Bảng giá lưu theo NGÀY, giống ngữ nghĩa `daterange` của Postgres: giá của
 * một ngày là bảng giá của ngày gần nhất không muộn hơn nó. Nhờ vậy không
 * nhập giá hôm nay thì vẫn dùng giá hôm qua, đúng như thực tế ở vựa.
 */

import {
  apBanSua,
  ngayHomNay,
  soKgTinhTien,
  taoDongHang,
  tinhSoKgDuKien,
  tinhThanhTien,
  toPhanNghin,
  uuidV7,
  type BanGhiSuaDon,
  type CauHinhQR,
  type ChiTietDonHang,
  type Dong,
  type DonHangDayDu,
  type DonViTinh,
  type Gia,
  type Gram,
  type KhachHang,
  type NhomGia,
  type SanPham,
  type ThongKeNgay,
} from '@vuaca/shared';
import type { NguonDuLieu, OGia } from './nguon.js';
import { duLieuMau } from './du-lieu-mau.js';

// --------------------------------------------------------------------------
// Danh mục mẫu — dùng chung với NguonSQLite qua du-lieu-mau.ts
// --------------------------------------------------------------------------

const MAU = duLieuMau();
const DON_VI_TINH = MAU.donVi;
const SAN_PHAM = MAU.sanPham;
const CAU_HINH_QR = MAU.cauHinhQR;
const NHOM_GIA_GOC = MAU.nhomGia;
const KHACH_GOC = MAU.khach;
const GIA_MAU = MAU.gia;

const khoaO = (sanPhamId: string, nhomGiaId: string) => `${sanPhamId}|${nhomGiaId}`;

// --------------------------------------------------------------------------

export class NguonBoNho implements NguonDuLieu {
  private nhomGia: NhomGia[] = structuredClone(NHOM_GIA_GOC);
  private khach: KhachHang[] = structuredClone(KHACH_GOC);
  /** ngày -> (sanPhamId|nhomGiaId -> giá mỗi kg) */
  private bangGia = new Map<string, Map<string, Dong>>();
  private don = new Map<string, DonHangDayDu>();
  private vetSua: BanGhiSuaDon[] = [];

  constructor() {
    this.seedGia();
    for (const d of this.taoDonMau()) this.don.set(d.id, d);
  }

  // ------------------------------------------------------------ danh mục

  async layNhomGia() {
    return structuredClone(this.nhomGia.filter((n) => !('daXoa' in n))).sort(
      (a, b) => a.thuTu - b.thuTu,
    );
  }
  async layDonViTinh() {
    return DON_VI_TINH;
  }
  async laySanPham() {
    return SAN_PHAM;
  }
  async layCauHinhQR() {
    return CAU_HINH_QR;
  }

  async themNhomGia(n: Omit<NhomGia, 'id'>): Promise<NhomGia> {
    const ma = n.ma.trim().toUpperCase();
    if (!ma) throw new Error('Phải nhập mã nhóm giá');
    if (this.nhomGia.some((x) => x.ma === ma)) throw new Error(`Mã "${ma}" đã tồn tại`);
    if (!n.ten.trim()) throw new Error('Phải nhập tên nhóm giá');

    const moi: NhomGia = { ...n, ma, ten: n.ten.trim(), id: uuidV7(), laMacDinh: false };
    this.nhomGia.push(moi);
    return structuredClone(moi);
  }

  async suaNhomGia(id: string, sua: Partial<Omit<NhomGia, 'id'>>) {
    const n = this.nhomGia.find((x) => x.id === id);
    if (!n) throw new Error('Không tìm thấy nhóm giá');

    if (sua.ma !== undefined) {
      const ma = sua.ma.trim().toUpperCase();
      if (!ma) throw new Error('Phải nhập mã nhóm giá');
      if (this.nhomGia.some((x) => x.id !== id && x.ma === ma))
        throw new Error(`Mã "${ma}" đã tồn tại`);
      n.ma = ma;
    }
    if (sua.ten !== undefined) {
      if (!sua.ten.trim()) throw new Error('Phải nhập tên nhóm giá');
      n.ten = sua.ten.trim();
    }
    if (sua.laSi !== undefined) n.laSi = sua.laSi;
    if (sua.thuTu !== undefined) n.thuTu = sua.thuTu;

    // FR-NG-06: đúng một nhóm mặc định
    if (sua.laMacDinh) {
      if (n.laSi) throw new Error('Nhóm mặc định dùng cho khách vãng lai nên không được là nhóm sỉ');
      for (const x of this.nhomGia) x.laMacDinh = x.id === id;
    }
  }

  async xoaNhomGia(id: string) {
    const n = this.nhomGia.find((x) => x.id === id);
    if (!n) return;
    // FR-NG-06
    if (n.laMacDinh) throw new Error('Không xoá được nhóm giá mặc định');
    // FR-NG-04
    const dangDung = this.khach.filter((k) => k.nhomGiaId === id);
    if (dangDung.length > 0) {
      throw new Error(
        `Còn ${dangDung.length} khách đang thuộc nhóm này. Chuyển họ sang nhóm khác trước.`,
      );
    }
    this.nhomGia = this.nhomGia.filter((x) => x.id !== id);
    for (const ngay of this.bangGia.keys()) {
      const bang = this.bangGia.get(ngay)!;
      for (const k of [...bang.keys()]) if (k.endsWith(`|${id}`)) bang.delete(k);
    }
  }

  // ----------------------------------------------------------- bảng giá

  private seedGia() {
    const bang = new Map<string, Dong>();
    for (const g of GIA_MAU) bang.set(khoaO(g.sanPhamId, g.nhomGiaId), g.gia);
    this.bangGia.set(ngayHomNay(), bang);
  }

  /** Ngày có bảng giá gần nhất, không muộn hơn `ngay`. */
  private ngayHieuLuc(ngay: string): string | null {
    const cac = [...this.bangGia.keys()].filter((d) => d <= ngay).sort();
    return cac[cac.length - 1] ?? null;
  }

  async layGiaNgay(ngay: string): Promise<Gia[]> {
    const hieuLuc = this.ngayHieuLuc(ngay);
    if (!hieuLuc) return [];
    const bang = this.bangGia.get(hieuLuc)!;
    const ra: Gia[] = [];
    for (const [khoa, gia] of bang) {
      const [sanPhamId, nhomGiaId] = khoa.split('|') as [string, string];
      ra.push({ sanPhamId, nhomGiaId, bangGiaId: `bg-${hieuLuc}-${khoa}`, gia });
    }
    return ra;
  }

  async layGiaHienHanh() {
    return this.layGiaNgay(ngayHomNay());
  }

  async layNgayCoGiaTruoc(ngay: string) {
    const cac = [...this.bangGia.keys()].filter((d) => d < ngay).sort();
    return cac[cac.length - 1] ?? null;
  }

  async luuBangGia(ngay: string, o: OGia[]) {
    const bang = new Map<string, Dong>();
    for (const x of o) {
      if (x.gia < 0) throw new Error('Giá không được âm');
      if (x.gia > 0) bang.set(khoaO(x.sanPhamId, x.nhomGiaId), Math.round(x.gia));
    }
    this.bangGia.set(ngay, bang);
  }

  // --------------------------------------------------------- khách hàng

  async layKhachHang() {
    return structuredClone(this.khach);
  }

  async themKhachHang(k: Omit<KhachHang, 'id'>): Promise<KhachHang> {
    if (!k.hoTen.trim()) throw new Error('Phải nhập tên khách hàng');
    // FR-KH-03
    if (k.soDienThoai && this.khach.some((x) => x.soDienThoai === k.soDienThoai)) {
      throw new Error(`Số điện thoại ${k.soDienThoai} đã có hồ sơ khách khác`);
    }
    const moi: KhachHang = { ...k, hoTen: k.hoTen.trim(), id: uuidV7() };
    this.khach.push(moi);
    return structuredClone(moi);
  }

  async suaKhachHang(id: string, sua: Partial<Omit<KhachHang, 'id'>>) {
    const k = this.khach.find((x) => x.id === id);
    if (!k) throw new Error('Không tìm thấy khách hàng');
    if (sua.hoTen !== undefined) {
      if (!sua.hoTen.trim()) throw new Error('Phải nhập tên khách hàng');
      k.hoTen = sua.hoTen.trim();
    }
    if (sua.soDienThoai !== undefined) {
      if (sua.soDienThoai && this.khach.some((x) => x.id !== id && x.soDienThoai === sua.soDienThoai))
        throw new Error(`Số điện thoại ${sua.soDienThoai} đã có hồ sơ khách khác`);
      k.soDienThoai = sua.soDienThoai;
    }
    if (sua.diaChi !== undefined) k.diaChi = sua.diaChi;
    if (sua.nhomGiaId !== undefined) k.nhomGiaId = sua.nhomGiaId;
    if (sua.ghiChu !== undefined) k.ghiChu = sua.ghiChu;
    if (sua.ma !== undefined) k.ma = sua.ma;
  }

  async xoaKhachHang(id: string) {
    // Xoá mềm: đơn cũ vẫn giữ tên và SĐT đã chụp lại
    this.khach = this.khach.filter((x) => x.id !== id);
  }

  // ----------------------------------------------------------- đơn hàng

  async luuDon(don: DonHangDayDu) {
    this.don.set(don.id, structuredClone(don));
  }

  async layDon(id: string) {
    const d = this.don.get(id);
    return d ? structuredClone(d) : null;
  }

  async layDonTheoNgay(ngayBan: string) {
    return [...this.don.values()]
      .filter((d) => d.ngayBan === ngayBan)
      .sort((a, b) => b.datLuc.localeCompare(a.datLuc))
      .map((d) => structuredClone(d));
  }

  async layBangDongHang() {
    return [...this.don.values()]
      .filter(
        (d) =>
          d.trangThai === 'DA_XAC_NHAN' &&
          (d.trangThaiDong === 'CHO_DONG' || d.trangThaiDong === 'DANG_DONG'),
      )
      .sort((a, b) => a.datLuc.localeCompare(b.datLuc))
      .map((d) => structuredClone(d));
  }

  async layDonChuaXongCuaKhach(khachHangId: string) {
    return [...this.don.values()]
      .filter(
        (d) =>
          d.khachHangId === khachHangId && d.trangThai !== 'HOAN_TAT' && d.trangThai !== 'DA_HUY',
      )
      .sort((a, b) => a.datLuc.localeCompare(b.datLuc))
      .map((d) => structuredClone(d));
  }

  async soThuTuTiepTheo(ngayBan: string) {
    const cua = [...this.don.values()].filter((d) => d.ngayBan === ngayBan);
    const max = cua.reduce((m, d) => {
      const n = Number(d.maDon.split('-')[2] ?? 0);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return max + 1;
  }

  // ------------------------------------------------------------ sửa đơn

  async suaDon(
    donId: string,
    chiTietMoi: ChiTietDonHang[],
    lyDo: string,
    nguoiDungId: string | null = null,
  ): Promise<DonHangDayDu> {
    const cu = this.don.get(donId);
    if (!cu) throw new Error(`Không tìm thấy đơn ${donId}`);
    // FR-SD-07
    if (cu.trangThai === 'DA_HUY') throw new Error('Đơn đã huỷ, phải mở lại đơn trước khi sửa');
    // FR-SD-03: lý do bắt buộc, chặn ở tầng dữ liệu chứ không chỉ ở giao diện
    if (!lyDo.trim()) throw new Error('Phải nhập lý do sửa đơn');

    const truoc = structuredClone(cu);
    const sau = apBanSua(cu, chiTietMoi);
    sau.lanSuaCuoi = new Date().toISOString();

    this.don.set(donId, sau);
    this.vetSua.push({
      id: uuidV7(),
      donHangId: donId,
      nguoiDungId,
      lyDo: lyDo.trim(),
      trangThaiLucSua: truoc.trangThai,
      trangThaiDongLucSua: truoc.trangThaiDong,
      truoc,
      sau: structuredClone(sau),
      tongTienTruoc: truoc.tongTien,
      tongTienSau: sau.tongTien,
      suaLuc: new Date().toISOString(),
    });

    // FR-SD-06: đơn đã đồng bộ mà sửa lại thì phải đưa vào hàng đợi gửi bản
    // mới. Nguồn bộ nhớ chưa có outbox — NguonSQLite sẽ làm việc này.

    return structuredClone(sau);
  }

  async huyDon(donId: string, lyDo: string, nguoiDungId: string | null = null) {
    const don = this.don.get(donId);
    if (!don) return;
    if (!lyDo.trim()) throw new Error('Phải nhập lý do huỷ đơn');

    const truoc = structuredClone(don);
    don.trangThai = 'DA_HUY';
    don.lyDoHuy = lyDo.trim();
    don.trangThaiDong = 'KHONG_CAN';
    don.lanSuaCuoi = new Date().toISOString();

    this.vetSua.push({
      id: uuidV7(),
      donHangId: donId,
      nguoiDungId,
      lyDo: `Huỷ đơn: ${lyDo.trim()}`,
      trangThaiLucSua: truoc.trangThai,
      trangThaiDongLucSua: truoc.trangThaiDong,
      truoc,
      sau: structuredClone(don),
      tongTienTruoc: truoc.tongTien,
      tongTienSau: don.tongTien,
      suaLuc: new Date().toISOString(),
    });
  }

  async layLichSuSuaDon(donId: string) {
    return this.vetSua
      .filter((v) => v.donHangId === donId)
      .sort((a, b) => b.suaLuc.localeCompare(a.suaLuc))
      .map((v) => structuredClone(v));
  }

  // ---------------------------------------------------------- đóng hàng

  async datTrangThaiDong(donId: string, dongId: string, daDong: boolean) {
    const don = this.don.get(donId);
    if (!don) return;
    const dong = don.chiTiet.find((c) => c.id === dongId);
    if (!dong) return;

    dong.daDong = daDong;
    dong.dongLuc = daDong ? new Date().toISOString() : null;

    const xong = don.chiTiet.every((c) => c.daDong);
    const batDau = don.chiTiet.some((c) => c.daDong);

    if (xong) {
      don.trangThaiDong = 'DA_DONG';
      don.dongXongLuc = new Date().toISOString();
    } else if (batDau) {
      don.trangThaiDong = 'DANG_DONG';
      don.batDauDongLuc ??= new Date().toISOString();
      don.dongXongLuc = null;
    } else {
      don.trangThaiDong = 'CHO_DONG';
      don.batDauDongLuc = null;
      don.dongXongLuc = null;
    }
  }

  async datKgThucTe(donId: string, dongId: string, gram: Gram | null) {
    const don = this.don.get(donId);
    if (!don) return;
    const dong = don.chiTiet.find((c) => c.id === dongId);
    if (!dong) return;

    dong.soKgThucTe = gram;
    dong.thanhTien = tinhThanhTien(soKgTinhTien(dong.soKgDuKien, gram), dong.donGia);

    don.tongTien = don.chiTiet.reduce((s, c) => s + c.thanhTien, 0);
    don.tongKg = don.chiTiet.reduce((s, c) => s + soKgTinhTien(c.soKgDuKien, c.soKgThucTe), 0);
    don.soLanSua += 1;
  }

  // ----------------------------------------------------------- thống kê

  async thongKe(ngayBan: string): Promise<ThongKeNgay> {
    const cua = [...this.don.values()].filter((d) => d.ngayBan === ngayBan);
    const hopLe = cua.filter((d) => d.trangThai !== 'DA_HUY');
    const tong = (loc: (d: DonHangDayDu) => boolean) =>
      hopLe.filter(loc).reduce((s, d) => s + d.tongTien, 0);

    return {
      ngayBan,
      soDon: hopLe.length,
      tongDoanhThu: hopLe.reduce((s, d) => s + d.tongTien, 0),
      tongKgDaBan: hopLe.reduce((s, d) => s + d.tongKg, 0),
      soDonSi: hopLe.filter((d) => d.laSi).length,
      soDonLe: hopLe.filter((d) => !d.laSi).length,
      thuTienMat: tong((d) => d.hinhThucTt === 'TIEN_MAT'),
      thuChuyenKhoan: tong((d) => d.hinhThucTt === 'CHUYEN_KHOAN'),
      chuaThu: tong((d) => d.trangThaiTt === 'CHUA_TRA'),
      soDonHuy: cua.filter((d) => d.trangThai === 'DA_HUY').length,
    };
  }

  // ------------------------------------------------------- dữ liệu mẫu

  /** Dựng sẵn vài đơn đang chờ đóng để bảng đóng hàng có gì mà xem. */
  private taoDonMau(): DonHangDayDu[] {
    const homNay = new Date();
    const ngayBan = ngayHomNay(homNay);
    const bang = this.bangGia.get(ngayBan)!;

    const mau: Array<{
      khach: KhachHang;
      phutTruoc: number;
      soTt: number;
      ghiChu: string | null;
      dong: Array<{ sp: string; dv: string; sl: number; ghiChu?: string }>;
    }> = [
      {
        khach: this.khach[0]!,
        phutTruoc: 47,
        soTt: 7,
        ghiChu: 'Giao trước 10h',
        dong: [
          { sp: 'sp-0-0', dv: 'dv-thung', sl: 5 },
          { sp: 'sp-0-1', dv: 'dv-kg', sl: 30, ghiChu: 'Để riêng, khách lấy trước' },
          { sp: 'sp-1-0', dv: 'dv-con', sl: 20 },
        ],
      },
      {
        khach: this.khach[1]!,
        phutTruoc: 12,
        soTt: 9,
        ghiChu: null,
        dong: [
          { sp: 'sp-0-0', dv: 'dv-thung', sl: 2 },
          { sp: 'sp-2-2', dv: 'dv-kg', sl: 45 },
        ],
      },
      {
        khach: this.khach[2]!,
        phutTruoc: 4,
        soTt: 11,
        ghiChu: 'Chờ xe tới lấy',
        dong: [{ sp: 'sp-1-1', dv: 'dv-thung', sl: 3 }],
      },
    ];

    return mau.map((m) => {
      const nhomGia = this.nhomGia.find((n) => n.id === m.khach.nhomGiaId)!;
      const datLuc = new Date(homNay.getTime() - m.phutTruoc * 60_000).toISOString();
      const donId = uuidV7(Date.parse(datLuc));

      const chiTiet: ChiTietDonHang[] = m.dong.map((d, i) => {
        const sp = SAN_PHAM.find((s) => s.id === d.sp)!;
        const dv = DON_VI_TINH.find((u) => u.id === d.dv)!;
        const khoa = khoaO(sp.id, nhomGia.id);
        const gia = bang.get(khoa)!;
        return taoDongHang({
          id: uuidV7(Date.parse(datLuc) + i),
          donHangId: donId,
          thuTu: i,
          sanPham: sp,
          donVi: dv,
          soLuong: toPhanNghin(d.sl),
          donGia: gia,
          bangGiaId: `bg-${ngayBan}-${khoa}`,
          ghiChu: d.ghiChu ?? null,
        });
      });

      return {
        id: donId,
        maDon: `POS-${ngayBan.replaceAll('-', '')}-${String(m.soTt).padStart(4, '0')}`,
        nguon: 'POS',
        khachHangId: m.khach.id,
        khachTen: m.khach.hoTen,
        khachSdt: m.khach.soDienThoai,
        khachDiaChi: m.khach.diaChi,
        nhomGiaId: nhomGia.id,
        nhomGiaTen: nhomGia.ten,
        laSi: nhomGia.laSi,
        nhomGiaSuaTay: false,
        tongTien: chiTiet.reduce((s, c) => s + c.thanhTien, 0),
        tongKg: chiTiet.reduce((s, c) => s + soKgTinhTien(c.soKgDuKien, c.soKgThucTe), 0),
        trangThai: 'DA_XAC_NHAN',
        trangThaiDong: 'CHO_DONG',
        trangThaiTt: 'CHUA_TRA',
        hinhThucTt: null,
        soTienDaNhan: 0,
        cauHinhQrId: null,
        qrPayload: null,
        ghiChu: m.ghiChu,
        lyDoHuy: null,
        ngayBan,
        datLuc,
        xacNhanLuc: datLuc,
        batDauDongLuc: null,
        dongXongLuc: null,
        hoanTatLuc: null,
        lanSuaCuoi: null,
        soLanSua: 0,
        chiTiet,
      };
    });
  }
}
