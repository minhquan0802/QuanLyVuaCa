package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.response.CongNoKhachResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LichSuCongNoResponse;
import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.entity.Lichsucongno;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.entity.Thanhtoan;
import com.minhquan.QuanLyVuaCa.enums.LoaiThayDoiCongNo;
import com.minhquan.QuanLyVuaCa.enums.NguonGocCongNo;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToan;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.DonhangRepository;
import com.minhquan.QuanLyVuaCa.repository.LichsucongnoRepository;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.minhquan.QuanLyVuaCa.repository.ThanhtoanRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service DUY NHẤT chịu trách nhiệm công nợ (tính + ghi sổ cái lichsucongno).
 * DonhangService/ThanhtoanService chỉ gọi xuLyDonGiaoThanhCong()/xuLyThanhToanXacNhan(), không tự tính nợ.
 */
@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CongNoService {

    TaiKhoanRepository taiKhoanRepository;
    DonhangRepository donhangRepository;
    ThanhtoanRepository thanhtoanRepository;
    LichsucongnoRepository lichsucongnoRepository;
    GioHangService gioHangService;
    ThongBaoService thongBaoService;
    int soNgayKhoa;
    int phanTramCanhBao;
    // @Lazy: chỉ dùng cho backfill Phase 1 (tinhCongNoTuLichSu) — DonhangService cũng gọi vào CongNoService
    // (hook giao hàng), nếu không đánh @Lazy ở đây sẽ tạo vòng lặp khởi tạo bean.
    DonhangService donhangService;

    public CongNoService(TaiKhoanRepository taiKhoanRepository,
                          DonhangRepository donhangRepository,
                          ThanhtoanRepository thanhtoanRepository,
                          LichsucongnoRepository lichsucongnoRepository,
                          GioHangService gioHangService,
                          ThongBaoService thongBaoService,
                          @Value("${cong-no.so-ngay-khoa}") int soNgayKhoa,
                          @Value("${cong-no.phan-tram-canh-bao}") int phanTramCanhBao,
                          @Lazy DonhangService donhangService) {
        this.taiKhoanRepository = taiKhoanRepository;
        this.donhangRepository = donhangRepository;
        this.thanhtoanRepository = thanhtoanRepository;
        this.lichsucongnoRepository = lichsucongnoRepository;
        this.gioHangService = gioHangService;
        this.thongBaoService = thongBaoService;
        this.soNgayKhoa = soNgayKhoa;
        this.phanTramCanhBao = phanTramCanhBao;
        this.donhangService = donhangService;
    }

    // ===== Phase 1: backfill công nợ ban đầu từ lịch sử đơn hàng =====

    // Nợ thực tế = tổng giá trị đơn GIAO_HANG_THANH_CONG - tổng thanh toán đã xác nhận, tính từ toàn bộ lịch sử
    public BigDecimal tinhCongNoTuLichSu(Taikhoan khach) {
        List<Donhang> donhangs = donhangRepository.findByIdthongtinkhachhang(khach.getIdtaikhoan());

        BigDecimal congNo = BigDecimal.ZERO;
        for (Donhang donhang : donhangs) {
            if (donhang.getTrangthaidonhang() != TrangThaiDonHang.GIAO_HANG_THANH_CONG) continue;

            congNo = congNo.add(donhangService.tinhTongTienDonHang(donhang.getIddonhang()));

            List<Thanhtoan> daThanhToan = thanhtoanRepository
                    .findByIddonhangAndTrangthai(donhang, TrangThaiThanhToan.DA_THANH_TOAN);
            for (Thanhtoan thanhtoan : daThanhToan) {
                congNo = congNo.subtract(thanhtoan.getSotien());
            }
        }
        return congNo;
    }

    @Transactional
    public void khoiTaoCongNo(String idtaikhoan) {
        Taikhoan khach = taiKhoanRepository.timTheoIdDeKhoa(idtaikhoan)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        if (lichsucongnoRepository.existsByIdtaikhoan(khach)) {
            throw new AppExceptions(ErrorCode.CONGNO_DA_KHOI_TAO);
        }

        BigDecimal congNo = tinhCongNoTuLichSu(khach);
        khach.setCongnohientai(congNo);
        taiKhoanRepository.save(khach);

        ghiSoCai(khach, LoaiThayDoiCongNo.DIEU_CHINH, congNo.abs(), congNo, null, null,
                "Khởi tạo công nợ từ lịch sử đơn hàng", null);
    }

    // ===== Phase 2: trigger tự động =====

    // Đơn giao thành công -> tăng nợ. donhang/tongTienDon do DonhangService tự tính và truyền vào
    // (tránh CongNoService phải gọi ngược lại DonhangService ở luồng này).
    @Transactional
    public void xuLyDonGiaoThanhCong(Donhang donhang, BigDecimal tongTienDon) {
        if (donhang.getIdthongtinkhachhang() == null) return; // khách lẻ, không tham gia công nợ

        Taikhoan khach = taiKhoanRepository.timTheoIdDeKhoa(donhang.getIdthongtinkhachhang()).orElse(null);
        if (khach == null || !coCongNo(khach)) return; // khách sỉ chưa mở hạn mức công nợ

        BigDecimal congNoCu = congNoHienTaiHoacKhong(khach);
        BigDecimal congNoMoi = congNoCu.add(tongTienDon);
        canhBaoAdminNeuVuotMoc(khach, congNoCu, khach.getHanmuctindung(), congNoMoi, khach.getHanmuctindung());

        khach.setCongnohientai(congNoMoi);
        if (congNoMoi.compareTo(khach.getHanmuctindung()) > 0 && khach.getNgayvuothanmuc() == null) {
            khach.setNgayvuothanmuc(Instant.now());
        }
        taiKhoanRepository.save(khach);

        ghiSoCai(khach, LoaiThayDoiCongNo.TANG, tongTienDon, congNoMoi,
                donhang.getIddonhang(), NguonGocCongNo.DON_HANG, null, null);

        // Nếu khách có số dư trả trước (congNoCu âm), tạo Thanhtoan record khấu trừ tự động
        if (congNoCu.compareTo(BigDecimal.ZERO) < 0) {
            BigDecimal khauTru = congNoCu.negate().min(tongTienDon);
            Thanhtoan t = new Thanhtoan();
            t.setIddonhang(donhang);
            t.setSotien(khauTru);
            t.setPhuongthuc("SO_DU");
            t.setTrangthai(TrangThaiThanhToan.DA_THANH_TOAN);
            t.setNgaythanhtoan(LocalDateTime.now());
            t.setGhichu("Khấu trừ từ số dư trả trước");
            thanhtoanRepository.save(t);
        }
    }

    // Thanh toán được xác nhận -> giảm nợ
    @Transactional
    public void xuLyThanhToanXacNhan(Thanhtoan thanhtoan) {
        String idKhach = thanhtoan.getIddonhang().getIdthongtinkhachhang();
        if (idKhach == null) return;

        Taikhoan khach = taiKhoanRepository.timTheoIdDeKhoa(idKhach).orElse(null);
        if (khach == null || !coCongNo(khach)) return;

        BigDecimal congNoMoi = congNoHienTaiHoacKhong(khach).subtract(thanhtoan.getSotien());
        khach.setCongnohientai(congNoMoi);
        if (congNoMoi.compareTo(khach.getHanmuctindung()) <= 0) {
            khach.setNgayvuothanmuc(null);
        }
        taiKhoanRepository.save(khach);

        ghiSoCai(khach, LoaiThayDoiCongNo.GIAM, thanhtoan.getSotien(), congNoMoi,
                thanhtoan.getIdthanhtoan(), NguonGocCongNo.THANH_TOAN, null, null);
    }

    // ===== Phase 4: chặn checkout theo nợ dự kiến + khóa đặt hàng =====

    // Ném exception nếu không được đặt hàng. Không làm gì nếu khách không tham gia công nợ.
    @Transactional
    public void kiemTraDuocDatHang(String idtaikhoan, boolean isWholesale) {
        Taikhoan khach = taiKhoanRepository.timTheoIdDeKhoa(idtaikhoan).orElse(null);
        if (khach == null || !coCongNo(khach)) return;

        if (kiemTraDangBiKhoa(khach)) {
            throw new AppExceptions(ErrorCode.TAIKHOAN_BI_KHOA_DAT_HANG);
        }

        BigDecimal noDuKien = congNoHienTaiHoacKhong(khach)
                .add(tongTienDonDangXuLy(khach))
                .add(gioHangService.tinhTongTienGioHangHienTai(idtaikhoan, isWholesale));

        if (noDuKien.compareTo(khach.getHanmuctindung()) > 0) {
            throw new AppExceptions(ErrorCode.VUOT_HAN_MUC_TIN_DUNG);
        }
    }

    private BigDecimal tongTienDonDangXuLy(Taikhoan khach) {
        List<TrangThaiDonHang> dangXuLy = List.of(
                TrangThaiDonHang.CHO_XAC_NHAN, TrangThaiDonHang.DA_THANH_TOAN,
                TrangThaiDonHang.DANG_DONG_HANG, TrangThaiDonHang.DANG_VAN_CHUYEN);
        return donhangRepository.findByIdthongtinkhachhang(khach.getIdtaikhoan()).stream()
                .filter(d -> dangXuLy.contains(d.getTrangthaidonhang()))
                .map(d -> donhangService.tinhTongTienDonHang(d.getIddonhang()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private boolean coCongNo(Taikhoan khach) {
        return khach.getHanmuctindung() != null && khach.getHanmuctindung().compareTo(BigDecimal.ZERO) > 0;
    }

    private BigDecimal congNoHienTaiHoacKhong(Taikhoan khach) {
        return khach.getCongnohientai() == null ? BigDecimal.ZERO : khach.getCongnohientai();
    }

    public boolean kiemTraDangBiKhoa(Taikhoan khach) {
        if (khach.getNgayvuothanmuc() == null) return false;
        long soNgayDaVuot = Duration.between(khach.getNgayvuothanmuc(), Instant.now()).toDays();
        return soNgayDaVuot > soNgayKhoa;
    }

    // Chỉ bắn khi vượt ngưỡng theo chiều TĂNG (% cũ < ngưỡng <= % mới) — tránh spam mỗi lần biến động nhỏ
    private void canhBaoAdminNeuVuotMoc(Taikhoan khach, BigDecimal congNoCu, BigDecimal hanMucCu,
                                         BigDecimal congNoMoi, BigDecimal hanMucMoi) {
        if (hanMucMoi == null || hanMucMoi.compareTo(BigDecimal.ZERO) <= 0) return;

        BigDecimal phanTramMoi = congNoMoi.multiply(BigDecimal.valueOf(100))
                .divide(hanMucMoi, 2, RoundingMode.HALF_UP);
        BigDecimal phanTramCu = (hanMucCu == null || hanMucCu.compareTo(BigDecimal.ZERO) <= 0)
                ? BigDecimal.ZERO
                : congNoCu.multiply(BigDecimal.valueOf(100)).divide(hanMucCu, 2, RoundingMode.HALF_UP);

        String tenKhach = khach.getHo() + " " + khach.getTen();
        String chiTiet = "(nợ " + congNoMoi + "đ / hạn mức " + hanMucMoi + "đ)";

        if (phanTramCu.compareTo(BigDecimal.valueOf(100)) < 0 && phanTramMoi.compareTo(BigDecimal.valueOf(100)) >= 0) {
            thongBaoService.guiChoVaiTro("ADMIN",
                    "Khách " + tenKhach + " đã vượt 100% hạn mức tín dụng " + chiTiet,
                    "CONG_NO_NGUY_HIEM", "/admin/QuanLyCongNo");
        } else if (phanTramCu.compareTo(BigDecimal.valueOf(phanTramCanhBao)) < 0
                && phanTramMoi.compareTo(BigDecimal.valueOf(phanTramCanhBao)) >= 0) {
            thongBaoService.guiChoVaiTro("ADMIN",
                    "Khách " + tenKhach + " đã đạt " + phanTramCanhBao + "% hạn mức tín dụng " + chiTiet,
                    "CONG_NO_CANH_BAO", "/admin/QuanLyCongNo");
        }
    }

    private Taikhoan layTaiKhoanHienTai() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));
    }

    private void ghiSoCai(Taikhoan khach, LoaiThayDoiCongNo loai, BigDecimal sotien, BigDecimal soDuSau,
                           String nguongocid, NguonGocCongNo nguongocloai, String ghichu, Taikhoan nguoiThucHien) {
        Lichsucongno lichSu = new Lichsucongno();
        lichSu.setIdtaikhoan(khach);
        lichSu.setLoaithaydoi(loai);
        lichSu.setSotien(sotien);
        lichSu.setSodusaukhithaydoi(soDuSau);
        lichSu.setNguongocid(nguongocid);
        lichSu.setNguongocloai(nguongocloai);
        lichSu.setNguoithuchien(nguoiThucHien);
        lichSu.setGhichu(ghichu);
        lichSu.setNgaytao(Instant.now());
        lichsucongnoRepository.save(lichSu);
    }

    // ===== Phase 5: dashboard admin =====

    public List<CongNoKhachResponse> layDanhSachKhachCoCongNo() {
        return taiKhoanRepository.findByHanmuctindungIsNotNull().stream()
                .map(khach -> CongNoKhachResponse.builder()
                        .idtaikhoan(khach.getIdtaikhoan())
                        .ho(khach.getHo())
                        .ten(khach.getTen())
                        .email(khach.getEmail())
                        .sodienthoai(khach.getSodienthoai())
                        .hanmuctindung(khach.getHanmuctindung())
                        .congnohientai(congNoHienTaiHoacKhong(khach))
                        .ngayvuothanmuc(khach.getNgayvuothanmuc())
                        .dangBiKhoa(kiemTraDangBiKhoa(khach))
                        .build())
                .toList();
    }

    @Transactional
    public void capNhatHanMuc(String idtaikhoan, BigDecimal hanMucMoi) {
        Taikhoan khach = taiKhoanRepository.timTheoIdDeKhoa(idtaikhoan)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        boolean laLanDauMoCongNo = !lichsucongnoRepository.existsByIdtaikhoan(khach);
        BigDecimal hanMucCu = khach.getHanmuctindung();
        khach.setHanmuctindung(hanMucMoi);

        if (laLanDauMoCongNo) {
            BigDecimal congNo = tinhCongNoTuLichSu(khach);
            canhBaoAdminNeuVuotMoc(khach, BigDecimal.ZERO, null, congNo, hanMucMoi);

            khach.setCongnohientai(congNo);
            taiKhoanRepository.save(khach);
            ghiSoCai(khach, LoaiThayDoiCongNo.DIEU_CHINH, congNo.abs(), congNo, null, null,
                    "Mở công nợ — khởi tạo từ lịch sử đơn hàng", layTaiKhoanHienTai());
            return;
        }

        // Đổi hạn mức có thể làm khách chuyển trạng thái vượt/hết vượt ngay, không cần đợi giao dịch mới
        BigDecimal congNoHienTai = congNoHienTaiHoacKhong(khach);
        canhBaoAdminNeuVuotMoc(khach, congNoHienTai, hanMucCu, congNoHienTai, hanMucMoi);

        if (congNoHienTai.compareTo(hanMucMoi) > 0 && khach.getNgayvuothanmuc() == null) {
            khach.setNgayvuothanmuc(Instant.now());
        } else if (congNoHienTai.compareTo(hanMucMoi) <= 0) {
            khach.setNgayvuothanmuc(null);
        }
        taiKhoanRepository.save(khach);
    }

    @Transactional
    public void dieuChinhThuCong(String idtaikhoan, BigDecimal sotien, boolean tang, String ghichu) {
        Taikhoan khach = taiKhoanRepository.timTheoIdDeKhoa(idtaikhoan)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        BigDecimal congNoCu = congNoHienTaiHoacKhong(khach);
        BigDecimal congNoMoi = tang ? congNoCu.add(sotien) : congNoCu.subtract(sotien);
        if (tang) canhBaoAdminNeuVuotMoc(khach, congNoCu, khach.getHanmuctindung(), congNoMoi, khach.getHanmuctindung());

        khach.setCongnohientai(congNoMoi);

        BigDecimal hanMuc = khach.getHanmuctindung();
        if (hanMuc != null) {
            if (congNoMoi.compareTo(hanMuc) > 0 && khach.getNgayvuothanmuc() == null) {
                khach.setNgayvuothanmuc(Instant.now());
            } else if (congNoMoi.compareTo(hanMuc) <= 0) {
                khach.setNgayvuothanmuc(null);
            }
        }
        taiKhoanRepository.save(khach);

        ghiSoCai(khach, LoaiThayDoiCongNo.DIEU_CHINH, sotien, congNoMoi, null, null,
                ghichu, layTaiKhoanHienTai());
    }

    @Transactional
    public void moKhoaThuCong(String idtaikhoan, String ghichu) {
        Taikhoan khach = taiKhoanRepository.timTheoIdDeKhoa(idtaikhoan)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        khach.setNgayvuothanmuc(null);
        taiKhoanRepository.save(khach);

        ghiSoCai(khach, LoaiThayDoiCongNo.DIEU_CHINH, BigDecimal.ZERO, congNoHienTaiHoacKhong(khach), null, null,
                "Mở khóa thủ công: " + ghichu, layTaiKhoanHienTai());
    }

    public List<LichSuCongNoResponse> layLichSu(String idtaikhoan) {
        Taikhoan khach = taiKhoanRepository.findById(idtaikhoan)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        return lichsucongnoRepository.findByIdtaikhoanOrderByNgaytaoDesc(khach).stream()
                .map(ls -> LichSuCongNoResponse.builder()
                        .idlichsucongno(ls.getIdlichsucongno())
                        .loaithaydoi(ls.getLoaithaydoi() != null ? ls.getLoaithaydoi().name() : null)
                        .sotien(ls.getSotien())
                        .sodusaukhithaydoi(ls.getSodusaukhithaydoi())
                        .nguongocid(ls.getNguongocid())
                        .nguongocloai(ls.getNguongocloai() != null ? ls.getNguongocloai().name() : null)
                        .tenNguoiThucHien(ls.getNguoithuchien() != null
                                ? ls.getNguoithuchien().getHo() + " " + ls.getNguoithuchien().getTen() : null)
                        .ghichu(ls.getGhichu())
                        .ngaytao(ls.getNgaytao())
                        .build())
                .toList();
    }
}
