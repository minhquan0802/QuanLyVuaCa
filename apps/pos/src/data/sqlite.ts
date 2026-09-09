/**
 * Nguồn dữ liệu thật trên máy quầy — SQLite qua tauri-plugin-sql.
 *
 * Cài cùng interface `NguonDuLieu` với `NguonBoNho`, nên giao diện không biết
 * và không cần biết dữ liệu nằm ở đâu.
 *
 * Tệp CSDL: %APPDATA%\vn.vuaca.pos\pos.db — xem `src-tauri/src/lib.rs`.
 * Lược đồ: `src-tauri/migrations/001_khoi_tao.sql`.
 *
 * Quy ước: mọi con số tiền và khối lượng là SỐ NGUYÊN, giống hệt tầng miền.
 * Boolean lưu bằng 0/1. Không có phép chuyển đổi đơn vị nào ở đây.
 */

import Database from '@tauri-apps/plugin-sql';
import {
  apBanSua,
  boDau,
  ngayHomNay,
  soKgTinhTien,
  tinhThanhTien,
  uuidV7,
  type BanGhiSuaDon,
  type CauHinhQR,
  type ChiTietDonHang,
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

/** Chưa có hệ thống đăng nhập nên mọi đơn ghi tạm dưới tài khoản này. */
const NHAN_VIEN_MAC_DINH = 'nv-mac-dinh';
/** Một máy quầy duy nhất — DAC-TA.md §11 quyết định 2. */
const MAY_QUAY = 'POS';

const bool = (v: unknown): boolean => v === 1 || v === true;
const so = (v: unknown): number => Number(v ?? 0);
const chu = (v: unknown): string | null => (v == null ? null : String(v));

export class NguonSQLite implements NguonDuLieu {
  private db!: Database;

  /** Mở CSDL, đặt PRAGMA, và gieo dữ liệu mẫu nếu lần đầu chạy. */
  async khoiTao(): Promise<void> {
    this.db = await Database.load('sqlite:pos.db');

    // PRAGMA phải chạy ngoài transaction nên không đặt được trong migration.
    // WAL: mất điện giữa ca không hỏng tệp (PC-02).
    for (const p of ['PRAGMA journal_mode = WAL', 'PRAGMA synchronous = FULL']) {
      try {
        await this.db.execute(p);
      } catch {
        // Không đặt được thì vẫn chạy tiếp, chỉ kém an toàn hơn khi mất điện
      }
    }

    const [{ n }] = await this.db.select<[{ n: number }]>(
      'SELECT count(*) AS n FROM nhom_gia',
    );
    if (so(n) === 0) await this.gieoDuLieuMau();
  }

  private async gieoDuLieuMau() {
    const m = duLieuMau();
    for (const n of m.nhomGia) {
      await this.db.execute(
        'INSERT INTO nhom_gia (id, ma, ten, la_si, thu_tu, la_mac_dinh) VALUES ($1,$2,$3,$4,$5,$6)',
        [n.id, n.ma, n.ten, n.laSi ? 1 : 0, n.thuTu, n.laMacDinh ? 1 : 0],
      );
    }
    for (const d of m.donVi) {
      await this.db.execute(
        'INSERT INTO don_vi_tinh (id, ma, ten, he_so_kg) VALUES ($1,$2,$3,$4)',
        [d.id, d.ma, d.ten, d.heSoKg],
      );
    }
    for (const s of m.sanPham) {
      await this.db.execute(
        `INSERT INTO san_pham (id, ma_sku, loai_ca_id, loai_ca_ten, size_ca_ten, thu_tu_size, don_vi_mac_dinh_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [s.id, s.maSku, s.loaiCaId, s.loaiCaTen, s.sizeCaTen, s.thuTuSize, s.donViMacDinhId],
      );
    }
    const homNay = ngayHomNay();
    for (const g of m.gia) {
      await this.db.execute(
        `INSERT INTO bang_gia (san_pham_id, nhom_gia_id, bang_gia_id, gia, hieu_luc_tu)
         VALUES ($1,$2,$3,$4,$5)`,
        [g.sanPhamId, g.nhomGiaId, g.bangGiaId, g.gia, homNay],
      );
    }
    for (const k of m.khach) {
      await this.db.execute(
        `INSERT INTO khach_hang (id, ma, ho_ten, ho_ten_tim, so_dien_thoai, dia_chi, nhom_gia_id, ghi_chu)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [k.id, k.ma, k.hoTen, boDau(k.hoTen), k.soDienThoai, k.diaChi, k.nhomGiaId, k.ghiChu],
      );
    }
    const q = m.cauHinhQR;
    await this.db.execute(
      `INSERT INTO cau_hinh_qr (id, ten_goi_nho, ngan_hang_bin, ngan_hang_ma, ngan_hang_ten,
        so_tai_khoan, ten_chu_tk, dang_dung) VALUES ($1,$2,$3,$4,$5,$6,$7,1)`,
      [q.id, q.tenGoiNho, q.nganHangBin, q.nganHangMa, q.nganHangTen, q.soTaiKhoan, q.tenChuTk],
    );
  }

  // ------------------------------------------------------------ danh mục

  async layNhomGia(): Promise<NhomGia[]> {
    const r = await this.db.select<Record<string, unknown>[]>(
      'SELECT * FROM nhom_gia ORDER BY thu_tu',
    );
    return r.map((x) => ({
      id: String(x.id),
      ma: String(x.ma),
      ten: String(x.ten),
      laSi: bool(x.la_si),
      thuTu: so(x.thu_tu),
      laMacDinh: bool(x.la_mac_dinh),
    }));
  }

  async layDonViTinh(): Promise<DonViTinh[]> {
    const r = await this.db.select<Record<string, unknown>[]>('SELECT * FROM don_vi_tinh');
    return r.map((x) => ({
      id: String(x.id),
      ma: String(x.ma),
      ten: String(x.ten),
      heSoKg: so(x.he_so_kg),
    }));
  }

  async laySanPham(): Promise<SanPham[]> {
    const r = await this.db.select<Record<string, unknown>[]>(
      'SELECT * FROM san_pham ORDER BY loai_ca_ten, thu_tu_size',
    );
    return r.map((x) => ({
      id: String(x.id),
      maSku: String(x.ma_sku),
      loaiCaId: String(x.loai_ca_id),
      loaiCaTen: String(x.loai_ca_ten),
      sizeCaTen: String(x.size_ca_ten),
      thuTuSize: so(x.thu_tu_size),
      donViMacDinhId: chu(x.don_vi_mac_dinh_id),
    }));
  }

  async layCauHinhQR(): Promise<CauHinhQR | null> {
    const r = await this.db.select<Record<string, unknown>[]>(
      'SELECT * FROM cau_hinh_qr WHERE dang_dung = 1 LIMIT 1',
    );
    const x = r[0];
    if (!x) return null;
    return {
      id: String(x.id),
      tenGoiNho: String(x.ten_goi_nho),
      nganHangBin: String(x.ngan_hang_bin),
      nganHangMa: String(x.ngan_hang_ma),
      nganHangTen: String(x.ngan_hang_ten),
      soTaiKhoan: String(x.so_tai_khoan),
      tenChuTk: String(x.ten_chu_tk),
      dangDung: bool(x.dang_dung),
    };
  }

  async themNhomGia(n: Omit<NhomGia, 'id'>): Promise<NhomGia> {
    const ma = n.ma.trim().toUpperCase();
    if (!ma) throw new Error('Phải nhập mã nhóm giá');
    if (!n.ten.trim()) throw new Error('Phải nhập tên nhóm giá');
    const trung = await this.db.select<Record<string, unknown>[]>(
      'SELECT id FROM nhom_gia WHERE ma = $1',
      [ma],
    );
    if (trung.length > 0) throw new Error(`Mã "${ma}" đã tồn tại`);

    const moi: NhomGia = { ...n, ma, ten: n.ten.trim(), id: uuidV7(), laMacDinh: false };
    await this.db.execute(
      'INSERT INTO nhom_gia (id, ma, ten, la_si, thu_tu, la_mac_dinh) VALUES ($1,$2,$3,$4,$5,0)',
      [moi.id, moi.ma, moi.ten, moi.laSi ? 1 : 0, moi.thuTu],
    );
    return moi;
  }

  async suaNhomGia(id: string, sua: Partial<Omit<NhomGia, 'id'>>) {
    const hienTai = (await this.layNhomGia()).find((x) => x.id === id);
    if (!hienTai) throw new Error('Không tìm thấy nhóm giá');

    if (sua.ma !== undefined) {
      const ma = sua.ma.trim().toUpperCase();
      if (!ma) throw new Error('Phải nhập mã nhóm giá');
      const trung = await this.db.select<Record<string, unknown>[]>(
        'SELECT id FROM nhom_gia WHERE ma = $1 AND id <> $2',
        [ma, id],
      );
      if (trung.length > 0) throw new Error(`Mã "${ma}" đã tồn tại`);
      await this.db.execute('UPDATE nhom_gia SET ma = $1 WHERE id = $2', [ma, id]);
    }
    if (sua.ten !== undefined) {
      if (!sua.ten.trim()) throw new Error('Phải nhập tên nhóm giá');
      await this.db.execute('UPDATE nhom_gia SET ten = $1 WHERE id = $2', [sua.ten.trim(), id]);
    }
    if (sua.laSi !== undefined) {
      await this.db.execute('UPDATE nhom_gia SET la_si = $1 WHERE id = $2', [
        sua.laSi ? 1 : 0,
        id,
      ]);
    }
    if (sua.thuTu !== undefined) {
      await this.db.execute('UPDATE nhom_gia SET thu_tu = $1 WHERE id = $2', [sua.thuTu, id]);
    }
    // FR-NG-06: đúng một nhóm mặc định, và nó không được là nhóm sỉ
    if (sua.laMacDinh) {
      const laSi = sua.laSi ?? hienTai.laSi;
      if (laSi)
        throw new Error('Nhóm mặc định dùng cho khách vãng lai nên không được là nhóm sỉ');
      await this.db.execute('UPDATE nhom_gia SET la_mac_dinh = 0');
      await this.db.execute('UPDATE nhom_gia SET la_mac_dinh = 1 WHERE id = $1', [id]);
    }
  }

  async xoaNhomGia(id: string) {
    const n = (await this.layNhomGia()).find((x) => x.id === id);
    if (!n) return;
    if (n.laMacDinh) throw new Error('Không xoá được nhóm giá mặc định');

    const [{ n: dem }] = await this.db.select<[{ n: number }]>(
      'SELECT count(*) AS n FROM khach_hang WHERE nhom_gia_id = $1',
      [id],
    );
    if (so(dem) > 0) {
      throw new Error(
        `Còn ${so(dem)} khách đang thuộc nhóm này. Chuyển họ sang nhóm khác trước.`,
      );
    }
    await this.db.execute('DELETE FROM bang_gia WHERE nhom_gia_id = $1', [id]);
    await this.db.execute('DELETE FROM nhom_gia WHERE id = $1', [id]);
  }

  // ------------------------------------------------------------ bảng giá

  /** Ngày có bảng giá gần nhất, không muộn hơn `ngay`. */
  private async ngayHieuLuc(ngay: string): Promise<string | null> {
    const r = await this.db.select<Record<string, unknown>[]>(
      'SELECT max(hieu_luc_tu) AS d FROM bang_gia WHERE hieu_luc_tu <= $1',
      [ngay],
    );
    return chu(r[0]?.d);
  }

  async layGiaNgay(ngay: string): Promise<Gia[]> {
    const hieuLuc = await this.ngayHieuLuc(ngay);
    if (!hieuLuc) return [];
    const r = await this.db.select<Record<string, unknown>[]>(
      'SELECT * FROM bang_gia WHERE hieu_luc_tu = $1',
      [hieuLuc],
    );
    return r.map((x) => ({
      sanPhamId: String(x.san_pham_id),
      nhomGiaId: String(x.nhom_gia_id),
      bangGiaId: String(x.bang_gia_id),
      gia: so(x.gia),
    }));
  }

  async layGiaHienHanh() {
    return this.layGiaNgay(ngayHomNay());
  }

  async layNgayCoGiaTruoc(ngay: string) {
    const r = await this.db.select<Record<string, unknown>[]>(
      'SELECT max(hieu_luc_tu) AS d FROM bang_gia WHERE hieu_luc_tu < $1',
      [ngay],
    );
    return chu(r[0]?.d);
  }

  async luuBangGia(ngay: string, o: OGia[]) {
    for (const x of o) if (x.gia < 0) throw new Error('Giá không được âm');
    await this.db.execute('DELETE FROM bang_gia WHERE hieu_luc_tu = $1', [ngay]);
    for (const x of o) {
      if (x.gia <= 0) continue;
      await this.db.execute(
        `INSERT INTO bang_gia (san_pham_id, nhom_gia_id, bang_gia_id, gia, hieu_luc_tu)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          x.sanPhamId,
          x.nhomGiaId,
          `bg-${ngay}-${x.sanPhamId}|${x.nhomGiaId}`,
          Math.round(x.gia),
          ngay,
        ],
      );
    }
  }

  // --------------------------------------------------------- khách hàng

  async layKhachHang(): Promise<KhachHang[]> {
    const r = await this.db.select<Record<string, unknown>[]>(
      'SELECT * FROM khach_hang ORDER BY ho_ten',
    );
    return r.map((x) => ({
      id: String(x.id),
      ma: chu(x.ma),
      hoTen: String(x.ho_ten),
      soDienThoai: chu(x.so_dien_thoai),
      diaChi: chu(x.dia_chi),
      nhomGiaId: String(x.nhom_gia_id),
      ghiChu: chu(x.ghi_chu),
    }));
  }

  async themKhachHang(k: Omit<KhachHang, 'id'>): Promise<KhachHang> {
    if (!k.hoTen.trim()) throw new Error('Phải nhập tên khách hàng');
    if (k.soDienThoai) {
      const trung = await this.db.select<Record<string, unknown>[]>(
        'SELECT id FROM khach_hang WHERE so_dien_thoai = $1',
        [k.soDienThoai],
      );
      if (trung.length > 0)
        throw new Error(`Số điện thoại ${k.soDienThoai} đã có hồ sơ khách khác`);
    }
    const moi: KhachHang = { ...k, hoTen: k.hoTen.trim(), id: uuidV7() };
    await this.db.execute(
      `INSERT INTO khach_hang (id, ma, ho_ten, ho_ten_tim, so_dien_thoai, dia_chi, nhom_gia_id, ghi_chu)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        moi.id,
        moi.ma,
        moi.hoTen,
        boDau(moi.hoTen),
        moi.soDienThoai,
        moi.diaChi,
        moi.nhomGiaId,
        moi.ghiChu,
      ],
    );
    return moi;
  }

  async suaKhachHang(id: string, sua: Partial<Omit<KhachHang, 'id'>>) {
    if (sua.hoTen !== undefined) {
      if (!sua.hoTen.trim()) throw new Error('Phải nhập tên khách hàng');
      await this.db.execute('UPDATE khach_hang SET ho_ten = $1, ho_ten_tim = $2 WHERE id = $3', [
        sua.hoTen.trim(),
        boDau(sua.hoTen),
        id,
      ]);
    }
    if (sua.soDienThoai !== undefined) {
      if (sua.soDienThoai) {
        const trung = await this.db.select<Record<string, unknown>[]>(
          'SELECT id FROM khach_hang WHERE so_dien_thoai = $1 AND id <> $2',
          [sua.soDienThoai, id],
        );
        if (trung.length > 0)
          throw new Error(`Số điện thoại ${sua.soDienThoai} đã có hồ sơ khách khác`);
      }
      await this.db.execute('UPDATE khach_hang SET so_dien_thoai = $1 WHERE id = $2', [
        sua.soDienThoai,
        id,
      ]);
    }
    if (sua.diaChi !== undefined)
      await this.db.execute('UPDATE khach_hang SET dia_chi = $1 WHERE id = $2', [sua.diaChi, id]);
    if (sua.nhomGiaId !== undefined)
      await this.db.execute('UPDATE khach_hang SET nhom_gia_id = $1 WHERE id = $2', [
        sua.nhomGiaId,
        id,
      ]);
    if (sua.ghiChu !== undefined)
      await this.db.execute('UPDATE khach_hang SET ghi_chu = $1 WHERE id = $2', [sua.ghiChu, id]);
    if (sua.ma !== undefined)
      await this.db.execute('UPDATE khach_hang SET ma = $1 WHERE id = $2', [sua.ma, id]);
  }

  async xoaKhachHang(id: string) {
    // Xoá cứng ở bảng khách; đơn cũ vẫn giữ tên và SĐT đã chụp lại nên
    // không mất dữ liệu lịch sử (FR-KH-04).
    await this.db.execute('DELETE FROM khach_hang WHERE id = $1', [id]);
  }

  // ----------------------------------------------------------- đơn hàng

  private docDon(x: Record<string, unknown>, chiTiet: ChiTietDonHang[]): DonHangDayDu {
    return {
      id: String(x.id),
      maDon: String(x.ma_don),
      nguon: String(x.nguon) === 'WEB' ? 'WEB' : 'POS',
      khachHangId: chu(x.khach_hang_id),
      khachTen: chu(x.khach_ten),
      khachSdt: chu(x.khach_sdt),
      khachDiaChi: chu(x.khach_dia_chi),
      nhomGiaId: String(x.nhom_gia_id),
      nhomGiaTen: String(x.nhom_gia_ten),
      laSi: bool(x.la_si),
      nhomGiaSuaTay: bool(x.nhom_gia_sua_tay),
      tongTien: so(x.tong_tien),
      tongKg: so(x.tong_kg),
      trangThai: String(x.trang_thai) as DonHangDayDu['trangThai'],
      trangThaiDong: String(x.trang_thai_dong) as DonHangDayDu['trangThaiDong'],
      trangThaiTt: String(x.trang_thai_tt) as DonHangDayDu['trangThaiTt'],
      hinhThucTt: (chu(x.hinh_thuc_tt) as DonHangDayDu['hinhThucTt']) ?? null,
      soTienDaNhan: so(x.so_tien_da_nhan),
      cauHinhQrId: chu(x.cau_hinh_qr_id),
      qrPayload: chu(x.qr_payload),
      ghiChu: chu(x.ghi_chu),
      lyDoHuy: chu(x.ly_do_huy),
      ngayBan: String(x.ngay_ban),
      datLuc: String(x.dat_luc),
      xacNhanLuc: chu(x.xac_nhan_luc),
      batDauDongLuc: chu(x.bat_dau_dong_luc),
      dongXongLuc: chu(x.dong_xong_luc),
      hoanTatLuc: chu(x.hoan_tat_luc),
      lanSuaCuoi: chu(x.lan_sua_cuoi),
      soLanSua: so(x.so_lan_sua),
      chiTiet,
    };
  }

  private docDong(x: Record<string, unknown>): ChiTietDonHang {
    return {
      id: String(x.id),
      donHangId: String(x.don_hang_id),
      sanPhamId: String(x.san_pham_id),
      loaiCaTen: String(x.loai_ca_ten),
      sizeCaTen: String(x.size_ca_ten),
      donViTinhId: chu(x.don_vi_tinh_id),
      donViTen: String(x.don_vi_ten),
      heSoKg: so(x.he_so_kg),
      soLuong: so(x.so_luong),
      soKgDuKien: so(x.so_kg_du_kien),
      soKgThucTe: x.so_kg_thuc_te == null ? null : so(x.so_kg_thuc_te),
      donGia: so(x.don_gia),
      giaSuaTay: bool(x.gia_sua_tay),
      bangGiaId: chu(x.bang_gia_id),
      thanhTien: so(x.thanh_tien),
      ghiChu: chu(x.ghi_chu),
      thuTu: so(x.thu_tu),
      daDong: bool(x.da_dong),
      dongLuc: chu(x.dong_luc),
    };
  }

  /** Lấy chi tiết cho NHIỀU đơn bằng MỘT truy vấn — HN-05, tránh N+1. */
  private async layChiTietCuaCacDon(ids: string[]): Promise<Map<string, ChiTietDonHang[]>> {
    const ra = new Map<string, ChiTietDonHang[]>();
    if (ids.length === 0) return ra;
    const cho = ids.map((_, i) => `$${i + 1}`).join(',');
    const r = await this.db.select<Record<string, unknown>[]>(
      `SELECT * FROM chi_tiet_don_hang WHERE don_hang_id IN (${cho}) ORDER BY thu_tu`,
      ids,
    );
    for (const x of r) {
      const d = this.docDong(x);
      const ds = ra.get(d.donHangId) ?? [];
      ds.push(d);
      ra.set(d.donHangId, ds);
    }
    return ra;
  }

  private async ghepDon(hang: Record<string, unknown>[]): Promise<DonHangDayDu[]> {
    const chiTiet = await this.layChiTietCuaCacDon(hang.map((x) => String(x.id)));
    return hang.map((x) => this.docDon(x, chiTiet.get(String(x.id)) ?? []));
  }

  async luuDon(don: DonHangDayDu) {
    await this.db.execute(
      `INSERT INTO don_hang (
        id, ma_don, may_quay_ma, nguoi_tao_id, khach_hang_id, khach_ten, khach_sdt, khach_dia_chi,
        nhom_gia_id, nhom_gia_ten, la_si, nhom_gia_sua_tay, nguon, tong_tien, tong_kg,
        trang_thai, trang_thai_dong, trang_thai_tt, hinh_thuc_tt, so_tien_da_nhan,
        cau_hinh_qr_id, qr_payload, ghi_chu, ly_do_huy, ngay_ban,
        dat_luc, xac_nhan_luc, bat_dau_dong_luc, dong_xong_luc, hoan_tat_luc,
        lan_sua_cuoi, so_lan_sua
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)`,
      [
        don.id, don.maDon, MAY_QUAY, NHAN_VIEN_MAC_DINH, don.khachHangId, don.khachTen,
        don.khachSdt, don.khachDiaChi, don.nhomGiaId, don.nhomGiaTen, don.laSi ? 1 : 0,
        don.nhomGiaSuaTay ? 1 : 0, don.nguon, don.tongTien, don.tongKg,
        don.trangThai, don.trangThaiDong, don.trangThaiTt, don.hinhThucTt, don.soTienDaNhan,
        don.cauHinhQrId, don.qrPayload, don.ghiChu, don.lyDoHuy, don.ngayBan,
        don.datLuc, don.xacNhanLuc, don.batDauDongLuc, don.dongXongLuc, don.hoanTatLuc,
        don.lanSuaCuoi, don.soLanSua,
      ],
    );
    await this.ghiChiTiet(don.id, don.chiTiet);

    // FR-SD-06 / đồng bộ: mỗi đơn hoàn tất đẩy một dòng vào hàng đợi gửi Host
    await this.db.execute(
      `INSERT INTO outbox (don_hang_id, payload, trang_thai, tao_luc)
       VALUES ($1,$2,'CHO',$3)
       ON CONFLICT(don_hang_id) DO UPDATE SET
         payload = excluded.payload, trang_thai = 'CHO', so_lan_thu = 0, thu_lai_sau = NULL`,
      [don.id, JSON.stringify(don), new Date().toISOString()],
    );
  }

  private async ghiChiTiet(donId: string, chiTiet: ChiTietDonHang[]) {
    await this.db.execute('DELETE FROM chi_tiet_don_hang WHERE don_hang_id = $1', [donId]);
    for (const c of chiTiet) {
      await this.db.execute(
        `INSERT INTO chi_tiet_don_hang (
          id, don_hang_id, san_pham_id, loai_ca_ten, size_ca_ten, don_vi_tinh_id, don_vi_ten,
          he_so_kg, so_luong, so_kg_du_kien, so_kg_thuc_te, don_gia, gia_sua_tay, bang_gia_id,
          thanh_tien, ghi_chu, thu_tu, da_dong, dong_luc
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [
          c.id, donId, c.sanPhamId, c.loaiCaTen, c.sizeCaTen, c.donViTinhId, c.donViTen,
          c.heSoKg, c.soLuong, c.soKgDuKien, c.soKgThucTe, c.donGia, c.giaSuaTay ? 1 : 0,
          c.bangGiaId, c.thanhTien, c.ghiChu, c.thuTu, c.daDong ? 1 : 0, c.dongLuc,
        ],
      );
    }
  }

  async layDon(id: string) {
    const r = await this.db.select<Record<string, unknown>[]>(
      'SELECT * FROM don_hang WHERE id = $1',
      [id],
    );
    if (r.length === 0) return null;
    return (await this.ghepDon(r))[0] ?? null;
  }

  async layDonTheoNgay(ngayBan: string) {
    const r = await this.db.select<Record<string, unknown>[]>(
      'SELECT * FROM don_hang WHERE ngay_ban = $1 ORDER BY dat_luc DESC',
      [ngayBan],
    );
    return this.ghepDon(r);
  }

  async layBangDongHang() {
    const r = await this.db.select<Record<string, unknown>[]>(
      `SELECT * FROM don_hang
       WHERE trang_thai = 'DA_XAC_NHAN' AND trang_thai_dong IN ('CHO_DONG','DANG_DONG')
       ORDER BY dat_luc`,
    );
    return this.ghepDon(r);
  }

  async layDonChuaXongCuaKhach(khachHangId: string) {
    const r = await this.db.select<Record<string, unknown>[]>(
      `SELECT * FROM don_hang
       WHERE khach_hang_id = $1 AND trang_thai NOT IN ('HOAN_TAT','DA_HUY')
       ORDER BY dat_luc`,
      [khachHangId],
    );
    return this.ghepDon(r);
  }

  async soThuTuTiepTheo(ngayBan: string) {
    // Bộ đếm riêng, không suy từ mã đơn: đơn bị xoá cũng không làm tụt số
    const r = await this.db.select<Record<string, unknown>[]>(
      'SELECT so_cuoi FROM bo_dem_so_don WHERE ngay = $1',
      [ngayBan],
    );
    const tiep = so(r[0]?.so_cuoi) + 1;
    await this.db.execute(
      `INSERT INTO bo_dem_so_don (ngay, so_cuoi) VALUES ($1,$2)
       ON CONFLICT(ngay) DO UPDATE SET so_cuoi = excluded.so_cuoi`,
      [ngayBan, tiep],
    );
    return tiep;
  }

  // ------------------------------------------------------------ sửa đơn

  async suaDon(
    donId: string,
    chiTietMoi: ChiTietDonHang[],
    lyDo: string,
    nguoiDungId: string | null = null,
  ): Promise<DonHangDayDu> {
    const cu = await this.layDon(donId);
    if (!cu) throw new Error(`Không tìm thấy đơn ${donId}`);
    if (cu.trangThai === 'DA_HUY') throw new Error('Đơn đã huỷ, phải mở lại đơn trước khi sửa');
    if (!lyDo.trim()) throw new Error('Phải nhập lý do sửa đơn');

    const sau = apBanSua(cu, chiTietMoi);
    sau.lanSuaCuoi = new Date().toISOString();

    await this.db.execute(
      `UPDATE don_hang SET tong_tien=$1, tong_kg=$2, trang_thai_dong=$3, dong_xong_luc=$4,
        lan_sua_cuoi=$5, so_lan_sua=$6 WHERE id=$7`,
      [
        sau.tongTien, sau.tongKg, sau.trangThaiDong, sau.dongXongLuc,
        sau.lanSuaCuoi, sau.soLanSua, donId,
      ],
    );
    await this.ghiChiTiet(donId, sau.chiTiet);
    await this.ghiVetSua(cu, sau, lyDo.trim(), nguoiDungId);
    await this.daySangOutbox(sau);
    return sau;
  }

  async huyDon(donId: string, lyDo: string, nguoiDungId: string | null = null) {
    const cu = await this.layDon(donId);
    if (!cu) return;
    if (!lyDo.trim()) throw new Error('Phải nhập lý do huỷ đơn');

    const sau: DonHangDayDu = {
      ...cu,
      trangThai: 'DA_HUY',
      lyDoHuy: lyDo.trim(),
      trangThaiDong: 'KHONG_CAN',
      lanSuaCuoi: new Date().toISOString(),
    };
    await this.db.execute(
      `UPDATE don_hang SET trang_thai='DA_HUY', ly_do_huy=$1, trang_thai_dong='KHONG_CAN',
        lan_sua_cuoi=$2 WHERE id=$3`,
      [sau.lyDoHuy, sau.lanSuaCuoi, donId],
    );
    await this.ghiVetSua(cu, sau, `Huỷ đơn: ${lyDo.trim()}`, nguoiDungId);
    await this.daySangOutbox(sau);
  }

  private async ghiVetSua(
    truoc: DonHangDayDu,
    sau: DonHangDayDu,
    lyDo: string,
    nguoiDungId: string | null,
  ) {
    await this.db.execute(
      `INSERT INTO lich_su_sua_don (don_hang_id, nguoi_dung_id, ly_do, trang_thai_luc_sua,
        trang_thai_dong_luc_sua, truoc, sau, tong_tien_truoc, tong_tien_sau, sua_luc)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        truoc.id, nguoiDungId, lyDo, truoc.trangThai, truoc.trangThaiDong,
        JSON.stringify(truoc), JSON.stringify(sau),
        truoc.tongTien, sau.tongTien, new Date().toISOString(),
      ],
    );
  }

  private async daySangOutbox(don: DonHangDayDu) {
    await this.db.execute(
      `INSERT INTO outbox (don_hang_id, payload, trang_thai, tao_luc)
       VALUES ($1,$2,'CHO',$3)
       ON CONFLICT(don_hang_id) DO UPDATE SET
         payload = excluded.payload, trang_thai = 'CHO', so_lan_thu = 0, thu_lai_sau = NULL`,
      [don.id, JSON.stringify(don), new Date().toISOString()],
    );
  }

  async layLichSuSuaDon(donId: string): Promise<BanGhiSuaDon[]> {
    const r = await this.db.select<Record<string, unknown>[]>(
      'SELECT * FROM lich_su_sua_don WHERE don_hang_id = $1 ORDER BY sua_luc DESC',
      [donId],
    );
    return r.map((x) => ({
      id: String(x.id),
      donHangId: String(x.don_hang_id),
      nguoiDungId: chu(x.nguoi_dung_id),
      lyDo: String(x.ly_do),
      trangThaiLucSua: String(x.trang_thai_luc_sua) as BanGhiSuaDon['trangThaiLucSua'],
      trangThaiDongLucSua: String(
        x.trang_thai_dong_luc_sua,
      ) as BanGhiSuaDon['trangThaiDongLucSua'],
      truoc: JSON.parse(String(x.truoc)) as DonHangDayDu,
      sau: JSON.parse(String(x.sau)) as DonHangDayDu,
      tongTienTruoc: so(x.tong_tien_truoc),
      tongTienSau: so(x.tong_tien_sau),
      suaLuc: String(x.sua_luc),
    }));
  }

  // ---------------------------------------------------------- đóng hàng

  async datTrangThaiDong(donId: string, dongId: string, daDong: boolean) {
    await this.db.execute(
      'UPDATE chi_tiet_don_hang SET da_dong = $1, dong_luc = $2 WHERE id = $3',
      [daDong ? 1 : 0, daDong ? new Date().toISOString() : null, dongId],
    );
    await this.tinhLaiTrangThaiDong(donId);
  }

  async datKgThucTe(donId: string, dongId: string, gram: Gram | null) {
    const r = await this.db.select<Record<string, unknown>[]>(
      'SELECT * FROM chi_tiet_don_hang WHERE id = $1',
      [dongId],
    );
    const x = r[0];
    if (!x) return;
    const dong = this.docDong(x);
    const thanhTien = tinhThanhTien(soKgTinhTien(dong.soKgDuKien, gram), dong.donGia);

    await this.db.execute(
      'UPDATE chi_tiet_don_hang SET so_kg_thuc_te = $1, thanh_tien = $2 WHERE id = $3',
      [gram, thanhTien, dongId],
    );
    await this.tinhLaiTongDon(donId);
  }

  private async tinhLaiTongDon(donId: string) {
    const r = await this.db.select<Record<string, unknown>[]>(
      `SELECT sum(thanh_tien) AS tien,
              sum(coalesce(so_kg_thuc_te, so_kg_du_kien)) AS kg
       FROM chi_tiet_don_hang WHERE don_hang_id = $1`,
      [donId],
    );
    await this.db.execute(
      'UPDATE don_hang SET tong_tien = $1, tong_kg = $2, so_lan_sua = so_lan_sua + 1 WHERE id = $3',
      [so(r[0]?.tien), so(r[0]?.kg), donId],
    );
  }

  private async tinhLaiTrangThaiDong(donId: string) {
    const r = await this.db.select<Record<string, unknown>[]>(
      `SELECT count(*) AS tong, sum(da_dong) AS xong
       FROM chi_tiet_don_hang WHERE don_hang_id = $1`,
      [donId],
    );
    const tong = so(r[0]?.tong);
    const xong = so(r[0]?.xong);
    const bayGio = new Date().toISOString();

    if (tong > 0 && xong === tong) {
      await this.db.execute(
        `UPDATE don_hang SET trang_thai_dong='DA_DONG', dong_xong_luc=$1 WHERE id=$2`,
        [bayGio, donId],
      );
    } else if (xong > 0) {
      await this.db.execute(
        `UPDATE don_hang SET trang_thai_dong='DANG_DONG', dong_xong_luc=NULL,
          bat_dau_dong_luc=coalesce(bat_dau_dong_luc,$1) WHERE id=$2`,
        [bayGio, donId],
      );
    } else {
      await this.db.execute(
        `UPDATE don_hang SET trang_thai_dong='CHO_DONG', bat_dau_dong_luc=NULL,
          dong_xong_luc=NULL WHERE id=$1`,
        [donId],
      );
    }
  }

  // ----------------------------------------------------------- thống kê

  async thongKe(ngayBan: string): Promise<ThongKeNgay> {
    // HN-01: chỉ đọc don_hang, không JOIN chi_tiet_don_hang
    const r = await this.db.select<Record<string, unknown>[]>(
      `SELECT
         count(*)                                                        AS so_don,
         coalesce(sum(tong_tien), 0)                                     AS doanh_thu,
         coalesce(sum(tong_kg), 0)                                       AS tong_kg,
         coalesce(sum(la_si), 0)                                         AS so_si,
         coalesce(sum(CASE WHEN hinh_thuc_tt='TIEN_MAT'     THEN tong_tien ELSE 0 END), 0) AS tien_mat,
         coalesce(sum(CASE WHEN hinh_thuc_tt='CHUYEN_KHOAN' THEN tong_tien ELSE 0 END), 0) AS ck,
         coalesce(sum(CASE WHEN trang_thai_tt='CHUA_TRA'    THEN tong_tien ELSE 0 END), 0) AS chua_thu
       FROM don_hang WHERE ngay_ban = $1 AND trang_thai <> 'DA_HUY'`,
      [ngayBan],
    );
    const huy = await this.db.select<Record<string, unknown>[]>(
      `SELECT count(*) AS n FROM don_hang WHERE ngay_ban = $1 AND trang_thai = 'DA_HUY'`,
      [ngayBan],
    );
    const x = r[0] ?? {};
    return {
      ngayBan,
      soDon: so(x.so_don),
      tongDoanhThu: so(x.doanh_thu),
      tongKgDaBan: so(x.tong_kg),
      soDonSi: so(x.so_si),
      soDonLe: so(x.so_don) - so(x.so_si),
      thuTienMat: so(x.tien_mat),
      thuChuyenKhoan: so(x.ck),
      chuaThu: so(x.chua_thu),
      soDonHuy: so(huy[0]?.n),
    };
  }
}
