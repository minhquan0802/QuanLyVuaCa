package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.entity.Lichsucongno;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.entity.Thanhtoan;
import com.minhquan.QuanLyVuaCa.enums.LoaiThayDoiCongNo;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.DonhangRepository;
import com.minhquan.QuanLyVuaCa.repository.LichsucongnoRepository;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.minhquan.QuanLyVuaCa.repository.ThanhtoanRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.*;

/**
 * Phase 8 (cong_no.md) — test các trường hợp biên của công nợ.
 * Unit test mock toàn bộ repository/service phụ thuộc: xác minh đúng QUY TẮC NGHIỆP VỤ
 * (nợ dự kiến cộng dồn, loại trừ đơn huỷ, reset/set ngay_vuot_han_muc, đối chiếu sổ cái...).
 * Không phải test concurrency thật ở tầng DB — phần đó cần test tích hợp với DB thật
 * (project chưa có profile test với H2/Testcontainers).
 */
@ExtendWith(MockitoExtension.class)
class CongNoServiceTest {

    static final int SO_NGAY_KHOA = 30;
    static final int PHAN_TRAM_CANH_BAO = 80;

    @Mock TaiKhoanRepository taiKhoanRepository;
    @Mock DonhangRepository donhangRepository;
    @Mock ThanhtoanRepository thanhtoanRepository;
    @Mock LichsucongnoRepository lichsucongnoRepository;
    @Mock GioHangService gioHangService;
    @Mock ThongBaoService thongBaoService;
    @Mock DonhangService donhangService;

    CongNoService congNoService;

    @BeforeEach
    void setUp() {
        congNoService = new CongNoService(taiKhoanRepository, donhangRepository, thanhtoanRepository,
                lichsucongnoRepository, gioHangService, thongBaoService,
                SO_NGAY_KHOA, PHAN_TRAM_CANH_BAO, donhangService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void dangNhapAdmin(String email) {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(email);
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);
    }

    private Taikhoan khachSi(BigDecimal hanMuc, BigDecimal congNo, Instant ngayVuot) {
        return Taikhoan.builder()
                .idtaikhoan("kh-1")
                .ho("Nguyen").ten("A")
                .email("khach@vuaca.vn")
                .hanmuctindung(hanMuc)
                .congnohientai(congNo)
                .ngayvuothanmuc(ngayVuot)
                .build();
    }

    private Donhang donHang(String id, String idKhach, TrangThaiDonHang trangThai) {
        Donhang d = new Donhang();
        d.setIddonhang(id);
        d.setIdthongtinkhachhang(idKhach);
        d.setTrangthaidonhang(trangThai);
        return d;
    }

    // ===== 1. Thanh toán một phần =====
    @Nested
    class ThanhToanMotPhan {

        @Test
        void vanConVuotHanMucSauKhiTraMotPhan_khongResetNgayVuotHanMuc() {
            Instant ngayVuotCu = Instant.now().minus(Duration.ofDays(5));
            Taikhoan khach = khachSi(BigDecimal.valueOf(10_000_000), BigDecimal.valueOf(12_000_000), ngayVuotCu);
            Donhang donhang = donHang("dh-1", khach.getIdtaikhoan(), TrangThaiDonHang.GIAO_HANG_THANH_CONG);
            Thanhtoan thanhToan = new Thanhtoan();
            thanhToan.setIddonhang(donhang);
            thanhToan.setSotien(BigDecimal.valueOf(1_000_000));

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));

            congNoService.xuLyThanhToanXacNhan(thanhToan);

            assertEquals(BigDecimal.valueOf(11_000_000), khach.getCongnohientai());
            assertEquals(ngayVuotCu, khach.getNgayvuothanmuc(), "vẫn còn vượt hạn mức -> chưa được mở khóa");

            ArgumentCaptor<Lichsucongno> captor = ArgumentCaptor.forClass(Lichsucongno.class);
            verify(lichsucongnoRepository).save(captor.capture());
            assertEquals(LoaiThayDoiCongNo.GIAM, captor.getValue().getLoaithaydoi());
            assertEquals(BigDecimal.valueOf(1_000_000), captor.getValue().getSotien());
            assertEquals(BigDecimal.valueOf(11_000_000), captor.getValue().getSodusaukhithaydoi());
        }

        @Test
        void traPhanCuoiVeDuoiHanMuc_resetNgayVuotHanMuc() {
            Taikhoan khach = khachSi(BigDecimal.valueOf(10_000_000), BigDecimal.valueOf(10_500_000), Instant.now());
            Donhang donhang = donHang("dh-1", khach.getIdtaikhoan(), TrangThaiDonHang.GIAO_HANG_THANH_CONG);
            Thanhtoan thanhToan = new Thanhtoan();
            thanhToan.setIddonhang(donhang);
            thanhToan.setSotien(BigDecimal.valueOf(1_000_000));

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));

            congNoService.xuLyThanhToanXacNhan(thanhToan);

            assertEquals(BigDecimal.valueOf(9_500_000), khach.getCongnohientai());
            assertNull(khach.getNgayvuothanmuc());
        }

        @Test
        void khachTraDuSoVoiNoHienTai_taoSoDuTraTruocAmKhongNemLoi() {
            Taikhoan khach = khachSi(BigDecimal.valueOf(10_000_000), BigDecimal.valueOf(500_000), null);
            Donhang donhang = donHang("dh-1", khach.getIdtaikhoan(), TrangThaiDonHang.GIAO_HANG_THANH_CONG);
            Thanhtoan thanhToan = new Thanhtoan();
            thanhToan.setIddonhang(donhang);
            thanhToan.setSotien(BigDecimal.valueOf(2_000_000));

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));

            assertDoesNotThrow(() -> congNoService.xuLyThanhToanXacNhan(thanhToan));

            assertEquals(BigDecimal.valueOf(-1_500_000), khach.getCongnohientai(),
                    "số âm = số dư trả trước, không phải lỗi");
        }

        @Test
        void khachLeKhongCoTaiKhoan_boQuaKhongDungToiTaiKhoanRepository() {
            Donhang donhang = donHang("dh-1", null, TrangThaiDonHang.GIAO_HANG_THANH_CONG);
            Thanhtoan thanhToan = new Thanhtoan();
            thanhToan.setIddonhang(donhang);
            thanhToan.setSotien(BigDecimal.valueOf(500_000));

            congNoService.xuLyThanhToanXacNhan(thanhToan);

            verifyNoInteractions(taiKhoanRepository, lichsucongnoRepository);
        }

        @Test
        void khachSiChuaMoHanMucCongNo_boQuaKhongGhiSoCai() {
            Taikhoan khach = khachSi(null, null, null);
            Donhang donhang = donHang("dh-1", khach.getIdtaikhoan(), TrangThaiDonHang.GIAO_HANG_THANH_CONG);
            Thanhtoan thanhToan = new Thanhtoan();
            thanhToan.setIddonhang(donhang);
            thanhToan.setSotien(BigDecimal.valueOf(500_000));

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));

            congNoService.xuLyThanhToanXacNhan(thanhToan);

            verify(lichsucongnoRepository, never()).save(any());
        }
    }

    // ===== 2. Đặt 2 đơn đồng thời (cộng dồn nợ dự kiến + giữ lock) =====
    @Nested
    class DatHangDongThoiVaNoDuKien {

        @Test
        void haiDonDangXuLyCongVoiGioHangHienTai_vuotHanMucNoDuKien_biChanCheckout() {
            // Mô phỏng lỗ hổng mục 2.2 cong_no.md: 1 đơn đã đặt trước (chưa giao) + giỏ hàng đơn mới
            // cộng lại vượt hạn mức, dù nợ thực tế hiện tại = 0.
            Taikhoan khach = khachSi(BigDecimal.valueOf(10_000_000), BigDecimal.ZERO, null);
            Donhang donDangXuLy = donHang("dh-1", khach.getIdtaikhoan(), TrangThaiDonHang.CHO_XAC_NHAN);

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));
            when(donhangRepository.findByIdthongtinkhachhang(khach.getIdtaikhoan())).thenReturn(List.of(donDangXuLy));
            when(donhangService.tinhTongTienDonHang("dh-1")).thenReturn(BigDecimal.valueOf(6_000_000));
            when(gioHangService.tinhTongTienGioHangHienTai(khach.getIdtaikhoan(), true))
                    .thenReturn(BigDecimal.valueOf(5_000_000));

            AppExceptions ex = assertThrows(AppExceptions.class,
                    () -> congNoService.kiemTraDuocDatHang(khach.getIdtaikhoan(), true));
            assertEquals(ErrorCode.VUOT_HAN_MUC_TIN_DUNG, ex.getErrorCode());
        }

        @Test
        void noDuKienTrongHanMuc_choPhepDatHang() {
            Taikhoan khach = khachSi(BigDecimal.valueOf(10_000_000), BigDecimal.ZERO, null);
            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));
            when(donhangRepository.findByIdthongtinkhachhang(khach.getIdtaikhoan())).thenReturn(List.of());
            when(gioHangService.tinhTongTienGioHangHienTai(khach.getIdtaikhoan(), true))
                    .thenReturn(BigDecimal.valueOf(5_000_000));

            assertDoesNotThrow(() -> congNoService.kiemTraDuocDatHang(khach.getIdtaikhoan(), true));
        }

        @Test
        void phaiDungTruyVanCoLockPessimisticWrite_khongDungFindByIdThuong() {
            // Regression guard: nếu sau này lỡ đổi sang findById thường, mất khóa chống
            // race condition giữa 2 request đặt hàng gần như đồng thời (mục 5.1 cong_no.md).
            Taikhoan khach = khachSi(BigDecimal.valueOf(10_000_000), BigDecimal.ZERO, null);
            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));
            when(donhangRepository.findByIdthongtinkhachhang(khach.getIdtaikhoan())).thenReturn(List.of());
            when(gioHangService.tinhTongTienGioHangHienTai(khach.getIdtaikhoan(), true)).thenReturn(BigDecimal.ZERO);

            congNoService.kiemTraDuocDatHang(khach.getIdtaikhoan(), true);

            verify(taiKhoanRepository).timTheoIdDeKhoa(khach.getIdtaikhoan());
            verify(taiKhoanRepository, never()).findById(any());
        }

        @Test
        void taiKhoanDangBiKhoaQuaHan_chanDatHangNgayCaKhiNoDuKienTrongHanMuc() {
            Instant vuot40NgayTruoc = Instant.now().minus(Duration.ofDays(40));
            Taikhoan khach = khachSi(BigDecimal.valueOf(10_000_000), BigDecimal.valueOf(2_000_000), vuot40NgayTruoc);
            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));

            AppExceptions ex = assertThrows(AppExceptions.class,
                    () -> congNoService.kiemTraDuocDatHang(khach.getIdtaikhoan(), true));
            assertEquals(ErrorCode.TAIKHOAN_BI_KHOA_DAT_HANG, ex.getErrorCode());
            verify(gioHangService, never()).tinhTongTienGioHangHienTai(any(), anyBoolean());
        }
    }

    // ===== 3. Huỷ đơn đang xử lý =====
    @Nested
    class HuyDonDangXuLy {

        @Test
        void donDaHuy_bienMatNgayKhoiNoDuKien_khongCanChoJobNao() {
            Taikhoan khach = khachSi(BigDecimal.valueOf(10_000_000), BigDecimal.ZERO, null);
            Donhang donHuy = donHang("dh-huy", khach.getIdtaikhoan(), TrangThaiDonHang.HUY);
            Donhang donConLai = donHang("dh-con-lai", khach.getIdtaikhoan(), TrangThaiDonHang.CHO_XAC_NHAN);

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));
            when(donhangRepository.findByIdthongtinkhachhang(khach.getIdtaikhoan()))
                    .thenReturn(List.of(donHuy, donConLai));
            when(donhangService.tinhTongTienDonHang("dh-con-lai")).thenReturn(BigDecimal.valueOf(3_000_000));
            when(gioHangService.tinhTongTienGioHangHienTai(khach.getIdtaikhoan(), true)).thenReturn(BigDecimal.ZERO);

            assertDoesNotThrow(() -> congNoService.kiemTraDuocDatHang(khach.getIdtaikhoan(), true));

            verify(donhangService, never()).tinhTongTienDonHang("dh-huy");
        }

        @Test
        void donDaGiaoThanhCong_khongBiTinhTrungVaoNoDuKien() {
            // Đơn đã giao thì giá trị của nó đã nằm trong congnohientai rồi (Phase 2),
            // không được cộng thêm lần nữa khi tính nợ dự kiến (Phase 4).
            Taikhoan khach = khachSi(BigDecimal.valueOf(10_000_000), BigDecimal.valueOf(4_000_000), null);
            Donhang donDaGiao = donHang("dh-da-giao", khach.getIdtaikhoan(), TrangThaiDonHang.GIAO_HANG_THANH_CONG);

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));
            when(donhangRepository.findByIdthongtinkhachhang(khach.getIdtaikhoan())).thenReturn(List.of(donDaGiao));
            when(gioHangService.tinhTongTienGioHangHienTai(khach.getIdtaikhoan(), true)).thenReturn(BigDecimal.ZERO);

            assertDoesNotThrow(() -> congNoService.kiemTraDuocDatHang(khach.getIdtaikhoan(), true));

            verify(donhangService, never()).tinhTongTienDonHang(any());
        }
    }

    // ===== 4. Admin mở khóa / điều chỉnh thủ công giữa kỳ =====
    @Nested
    class AdminThaoTacThuCong {

        @Test
        void moKhoaThuCong_xoaNgayVuotHanMuc_ghiSoCaiVoiNguoiThucHienVaGhiChu() {
            dangNhapAdmin("admin@vuaca.vn");
            Taikhoan admin = Taikhoan.builder().idtaikhoan("admin-1").ho("Admin").ten("Boss")
                    .email("admin@vuaca.vn").build();
            Taikhoan khach = khachSi(BigDecimal.valueOf(10_000_000), BigDecimal.valueOf(12_000_000),
                    Instant.now().minus(Duration.ofDays(35)));

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));
            when(taiKhoanRepository.findByEmail("admin@vuaca.vn")).thenReturn(Optional.of(admin));

            congNoService.moKhoaThuCong(khach.getIdtaikhoan(), "Khách hứa trả trong tuần");

            assertNull(khach.getNgayvuothanmuc());
            assertEquals(BigDecimal.valueOf(12_000_000), khach.getCongnohientai(), "mở khóa không tự đổi số nợ");

            ArgumentCaptor<Lichsucongno> captor = ArgumentCaptor.forClass(Lichsucongno.class);
            verify(lichsucongnoRepository).save(captor.capture());
            assertEquals(admin, captor.getValue().getNguoithuchien());
            assertTrue(captor.getValue().getGhichu().contains("Khách hứa trả trong tuần"));
        }

        @Test
        void dieuChinhThuCongCongThem_lamVuotHanMucLanDau_setNgayVuotHanMuc() {
            dangNhapAdmin("admin@vuaca.vn");
            Taikhoan admin = Taikhoan.builder().idtaikhoan("admin-1").ho("Admin").ten("Boss")
                    .email("admin@vuaca.vn").build();
            Taikhoan khach = khachSi(BigDecimal.valueOf(10_000_000), BigDecimal.valueOf(9_000_000), null);

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));
            when(taiKhoanRepository.findByEmail("admin@vuaca.vn")).thenReturn(Optional.of(admin));

            congNoService.dieuChinhThuCong(khach.getIdtaikhoan(), BigDecimal.valueOf(2_000_000), true,
                    "Phụ phí giao hàng xa");

            assertEquals(BigDecimal.valueOf(11_000_000), khach.getCongnohientai());
            assertNotNull(khach.getNgayvuothanmuc());
        }

        @Test
        void dieuChinhThuCongGiamNo_veDuoiHanMuc_resetNgayVuotHanMuc() {
            dangNhapAdmin("admin@vuaca.vn");
            Taikhoan admin = Taikhoan.builder().idtaikhoan("admin-1").ho("Admin").ten("Boss")
                    .email("admin@vuaca.vn").build();
            Taikhoan khach = khachSi(BigDecimal.valueOf(10_000_000), BigDecimal.valueOf(11_000_000), Instant.now());

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));
            when(taiKhoanRepository.findByEmail("admin@vuaca.vn")).thenReturn(Optional.of(admin));

            congNoService.dieuChinhThuCong(khach.getIdtaikhoan(), BigDecimal.valueOf(2_000_000), false,
                    "Chiết khấu cuối tháng");

            assertEquals(BigDecimal.valueOf(9_000_000), khach.getCongnohientai());
            assertNull(khach.getNgayvuothanmuc());
        }

        @Test
        void dieuChinhThuCong_khachChuaMoHanMuc_khongNemLoiVaKhongSetNgayVuot() {
            dangNhapAdmin("admin@vuaca.vn");
            Taikhoan admin = Taikhoan.builder().idtaikhoan("admin-1").ho("Admin").ten("Boss")
                    .email("admin@vuaca.vn").build();
            Taikhoan khach = khachSi(null, BigDecimal.ZERO, null);

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));
            when(taiKhoanRepository.findByEmail("admin@vuaca.vn")).thenReturn(Optional.of(admin));

            assertDoesNotThrow(() -> congNoService.dieuChinhThuCong(
                    khach.getIdtaikhoan(), BigDecimal.valueOf(500_000), true, "Ghi nhận tạm"));

            assertEquals(BigDecimal.valueOf(500_000), khach.getCongnohientai());
            assertNull(khach.getNgayvuothanmuc());
        }

        @Test
        void capNhatHanMucLanDauMo_backfillCongNoTuLichSuDonHang() {
            dangNhapAdmin("admin@vuaca.vn");
            Taikhoan admin = Taikhoan.builder().idtaikhoan("admin-1").ho("Admin").ten("Boss")
                    .email("admin@vuaca.vn").build();
            Taikhoan khach = khachSi(null, null, null);
            Donhang donDaGiao = donHang("dh-1", khach.getIdtaikhoan(), TrangThaiDonHang.GIAO_HANG_THANH_CONG);

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));
            when(taiKhoanRepository.findByEmail("admin@vuaca.vn")).thenReturn(Optional.of(admin));
            when(lichsucongnoRepository.existsByIdtaikhoan(khach)).thenReturn(false);
            when(donhangRepository.findByIdthongtinkhachhang(khach.getIdtaikhoan())).thenReturn(List.of(donDaGiao));
            when(donhangService.tinhTongTienDonHang("dh-1")).thenReturn(BigDecimal.valueOf(3_000_000));
            when(thanhtoanRepository.findByIddonhangAndTrangthai(eq(donDaGiao), any()))
                    .thenReturn(List.of());

            congNoService.capNhatHanMuc(khach.getIdtaikhoan(), BigDecimal.valueOf(10_000_000));

            assertEquals(BigDecimal.valueOf(10_000_000), khach.getHanmuctindung());
            assertEquals(BigDecimal.valueOf(3_000_000), khach.getCongnohientai());
            verify(lichsucongnoRepository).save(any(Lichsucongno.class));
        }

        @Test
        void capNhatHanMucGiuaKy_haHanMucXuongDuoiNoHienTai_setNgayVuotHanMuc() {
            Taikhoan khach = khachSi(BigDecimal.valueOf(10_000_000), BigDecimal.valueOf(9_000_000), null);

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));
            when(lichsucongnoRepository.existsByIdtaikhoan(khach)).thenReturn(true);

            congNoService.capNhatHanMuc(khach.getIdtaikhoan(), BigDecimal.valueOf(8_000_000));

            assertEquals(BigDecimal.valueOf(8_000_000), khach.getHanmuctindung());
            assertNotNull(khach.getNgayvuothanmuc());
            // Đổi hạn mức giữa kỳ không tự ghi sổ cái vì không làm thay đổi congnohientai
            verify(lichsucongnoRepository, never()).save(any());
        }
    }

    // ===== 5. Đối chiếu congnohientai luôn khớp tổng lichsucongno =====
    @Nested
    class DoiChieuSoCaiVoiCongNoHienTai {

        @Test
        void chuoiNghiepVuTangGiamDieuChinh_soDuTungDongSoCai_luonKhopVoiCongNoHienTaiCuoiCung() {
            dangNhapAdmin("admin@vuaca.vn");
            Taikhoan admin = Taikhoan.builder().idtaikhoan("admin-1").ho("Admin").ten("Boss")
                    .email("admin@vuaca.vn").build();
            Taikhoan khach = khachSi(BigDecimal.valueOf(20_000_000), BigDecimal.ZERO, null);

            when(taiKhoanRepository.timTheoIdDeKhoa(khach.getIdtaikhoan())).thenReturn(Optional.of(khach));
            when(taiKhoanRepository.findByEmail("admin@vuaca.vn")).thenReturn(Optional.of(admin));

            // 1. Đơn A giao thành công: +8,000,000
            Donhang donA = donHang("dh-A", khach.getIdtaikhoan(), TrangThaiDonHang.GIAO_HANG_THANH_CONG);
            congNoService.xuLyDonGiaoThanhCong(donA, BigDecimal.valueOf(8_000_000));

            // 2. Khách trả một phần đơn A: -3,000,000
            Thanhtoan tt1 = new Thanhtoan();
            tt1.setIddonhang(donA);
            tt1.setSotien(BigDecimal.valueOf(3_000_000));
            congNoService.xuLyThanhToanXacNhan(tt1);

            // 3. Đơn B giao thành công: +6,000,000
            Donhang donB = donHang("dh-B", khach.getIdtaikhoan(), TrangThaiDonHang.GIAO_HANG_THANH_CONG);
            congNoService.xuLyDonGiaoThanhCong(donB, BigDecimal.valueOf(6_000_000));

            // 4. Admin chiết khấu thiện chí: -1,500,000
            congNoService.dieuChinhThuCong(khach.getIdtaikhoan(), BigDecimal.valueOf(1_500_000), false,
                    "Chiết khấu thiện chí");

            // 5. Khách trả hết phần còn lại + trả dư 200,000 (overpayment)
            BigDecimal soDuTruocKhiTraCuoi = khach.getCongnohientai();
            Thanhtoan tt2 = new Thanhtoan();
            tt2.setIddonhang(donB);
            tt2.setSotien(soDuTruocKhiTraCuoi.add(BigDecimal.valueOf(200_000)));
            congNoService.xuLyThanhToanXacNhan(tt2);

            ArgumentCaptor<Lichsucongno> captor = ArgumentCaptor.forClass(Lichsucongno.class);
            verify(lichsucongnoRepository, times(5)).save(captor.capture());
            List<Lichsucongno> banGhi = captor.getAllValues();

            List<BigDecimal> soDuKyVongSauTungDong = List.of(
                    BigDecimal.valueOf(8_000_000),
                    BigDecimal.valueOf(5_000_000),
                    BigDecimal.valueOf(11_000_000),
                    BigDecimal.valueOf(9_500_000),
                    BigDecimal.valueOf(-200_000));

            for (int i = 0; i < banGhi.size(); i++) {
                assertEquals(soDuKyVongSauTungDong.get(i), banGhi.get(i).getSodusaukhithaydoi(),
                        "Số dư sau dòng sổ cái #" + (i + 1) + " sai");
            }

            // Bất biến cốt lõi của Phase 8: dòng sổ cái cuối cùng phải khớp đúng congnohientai hiện tại
            assertEquals(khach.getCongnohientai(),
                    banGhi.get(banGhi.size() - 1).getSodusaukhithaydoi());
            assertEquals(BigDecimal.valueOf(-200_000), khach.getCongnohientai(),
                    "khách trả dư -> số dư trả trước 200,000đ");
        }
    }
}
