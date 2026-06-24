package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietDonhangRequest;
import com.minhquan.QuanLyVuaCa.dto.request.DonhangRequestCreation;
import com.minhquan.QuanLyVuaCa.dto.request.UpdateCanNangRequest;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiCa;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.mapper.DonhangMapper;
import com.minhquan.QuanLyVuaCa.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Bug: đơn COD chỉ trừ Chitietcaban.soluongton (kho tổng) lúc tạo đơn, không trừ
 * Chitietphieunhap.soluongconlai (lô) -> "lô còn hàng" của màn thanh lý lệch khỏi kho hàng.
 * Đơn bán tại quầy (POS) và đơn "thanh toán sau" thì không trừ kho ở đâu cả.
 * Thiết kế sau khi sửa: trừ kho/lô ngay lúc tạo CHỈ khi đơn tạo thẳng trạng thái khác
 * CHO_XAC_NHAN (POS); còn lại (mặc định CHO_XAC_NHAN từ checkout online) để dành trừ ở
 * updateStatus() khi đơn rời CHO_XAC_NHAN — riêng VNPAY tự trừ qua callback riêng (truSoluongTon),
 * không đi qua updateStatus() nên không trừ trùng. Nhờ vậy huyDonHang() không cần hoàn gì cả.
 */
@ExtendWith(MockitoExtension.class)
class DonhangServiceLoSyncTest {

    @Mock DonhangRepository donhangRepository;
    @Mock ChitietdonhangRepository chitietdonhangRepository;
    @Mock ChitietcabanRepository chitietcabanRepository;
    @Mock ChitietphieunhapRepository chitietphieunhapRepository;
    @Mock DonvitinhRepository donvitinhRepository;
    @Mock TaiKhoanRepository taikhoanRepository;
    @Mock DonhangMapper donhangMapper;
    @Mock CongNoService congNoService;
    @Mock QuydoiRepository quydoiRepository;
    @Mock BanggiaRepository banggiaRepository;

    DonhangService donhangService;

    @BeforeEach
    void setUp() {
        donhangService = new DonhangService(donhangRepository, chitietdonhangRepository, chitietcabanRepository,
                chitietphieunhapRepository, donvitinhRepository, taikhoanRepository, donhangMapper, congNoService,
                quydoiRepository, banggiaRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Taikhoan dangNhap(String idtaikhoan, String email) {
        Taikhoan khach = Taikhoan.builder().idtaikhoan(idtaikhoan).ho("Nguyen").ten("A").email(email).build();
        when(taikhoanRepository.findByEmail(email)).thenReturn(Optional.of(khach));

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(email);
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);
        return khach;
    }

    private Loaica loaica(String ten) {
        Loaica l = new Loaica();
        l.setTenloaica(ten);
        return l;
    }

    private Sizeca sizeca(String ten) {
        Sizeca s = new Sizeca();
        s.setSizeca(ten);
        return s;
    }

    private Chitietcaban kho(BigDecimal soluongton) {
        return Chitietcaban.builder()
                .id(1)
                .idloaica(loaica("Cá điêu hồng"))
                .idsizeca(sizeca("Size 1"))
                .soluongton(soluongton)
                .deleted(false)
                .build();
    }

    private Chitietphieunhap lo(String id, Chitietcaban kho, LocalDate ngaynhap, BigDecimal soluongnhap,
                                 BigDecimal soluongconlai, TrangThaiCa trangThai) {
        Phieunhap phieunhap = new Phieunhap();
        phieunhap.setNgaynhap(ngaynhap);

        Chitietphieunhap lo = new Chitietphieunhap();
        lo.setIdchitietphieunhap(id);
        lo.setIdchitietcaban(kho);
        lo.setIdphieunhap(phieunhap);
        lo.setSoluongnhap(soluongnhap);
        lo.setSoluongconlai(soluongconlai);
        lo.setTrangthaica(trangThai);
        return lo;
    }

    // ===== Tạo đơn: chỉ trừ kho/lô ngay nếu đơn tạo thẳng trạng thái khác CHO_XAC_NHAN (POS) =====
    @Nested
    class TaoDonHang {

        private DonhangRequestCreation.DonhangRequestCreationBuilder requestCoSan() {
            return DonhangRequestCreation.builder()
                    .chiTietDonHang(List.of(ChitietDonhangRequest.builder()
                            .idchitietcaban("1")
                            .soluong(1)
                            .build()));
        }

        private void mockChuoiTinhToan(Chitietcaban kho, Chitietdonhang ctdh, DonhangRequestCreation request) {
            Donhang donhangEntity = new Donhang();
            when(donhangMapper.toDonhang(request)).thenReturn(donhangEntity);
            when(donhangRepository.save(any(Donhang.class))).thenAnswer(inv -> {
                Donhang d = inv.getArgument(0);
                d.setIddonhang("dh-1");
                return d;
            });

            ctdh.setSoluong(1);
            when(donhangMapper.toChitietEntity(any())).thenReturn(ctdh);
            when(chitietcabanRepository.findById(1)).thenReturn(Optional.of(kho));

            Quydoi quydoi = new Quydoi();
            quydoi.setSokgtuongung(BigDecimal.valueOf(35)); // 1 đơn vị = 35kg -> luongCanTru = 35kg
            when(quydoiRepository.findByIdchitietcaban(kho)).thenReturn(Optional.of(quydoi));

            Banggia banggia = new Banggia();
            banggia.setGiabanle(BigDecimal.valueOf(50000));
            when(banggiaRepository.findByChitietcabanAndNgayketthucIsNull(kho)).thenReturn(Optional.of(banggia));

            Donvitinh dvt = new Donvitinh();
            dvt.setId(1);
            when(donvitinhRepository.findById(1)).thenReturn(Optional.of(dvt));
        }

        @Test
        void taoDonPOS_trangThaiKhacChoXacNhan_truNgayCaLoVaKhoTong_theoFIFO() {
            Chitietcaban kho = kho(BigDecimal.valueOf(50));
            Chitietphieunhap loCu = lo("lo-cu", kho, LocalDate.of(2026, 1, 1),
                    BigDecimal.valueOf(30), BigDecimal.valueOf(30), TrangThaiCa.CON_HANG);
            Chitietphieunhap loMoi = lo("lo-moi", kho, LocalDate.of(2026, 2, 1),
                    BigDecimal.valueOf(20), BigDecimal.valueOf(20), TrangThaiCa.CON_HANG);

            DonhangRequestCreation request = requestCoSan()
                    .ghichu("[POS]")
                    .trangthaidonhang(TrangThaiDonHang.DA_THANH_TOAN)
                    .build();
            mockChuoiTinhToan(kho, new Chitietdonhang(), request);

            when(chitietphieunhapRepository.findByIdchitietcabanAndSoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(
                    eq(kho), eq(BigDecimal.ZERO)))
                    .thenReturn(List.of(loCu, loMoi));

            donhangService.createDonhang(request);

            // luongCanTru = 1 * 35kg. FIFO lấy hết lô cũ (30kg) trước, còn thiếu 5kg lấy tiếp lô mới.
            assertEquals(BigDecimal.ZERO, loCu.getSoluongconlai());
            assertEquals(TrangThaiCa.HET_HANG, loCu.getTrangthaica());
            assertEquals(BigDecimal.valueOf(15), loMoi.getSoluongconlai());
            assertEquals(BigDecimal.valueOf(15), kho.getSoluongton(), "kho tổng: 50 - 35 = 15");
        }

        @Test
        void taoDonMacDinhChoXacNhan_khongTruGiCaLoVaKhoTong() {
            // Mặc định CHO_XAC_NHAN (checkout online: COD/VNPAY/thanh toán sau) -> để dành trừ ở
            // updateStatus() khi đơn rời CHO_XAC_NHAN, không trừ ngay lúc tạo.
            Chitietcaban kho = kho(BigDecimal.valueOf(50));
            DonhangRequestCreation request = requestCoSan().build(); // không set trangthaidonhang
            mockChuoiTinhToan(kho, new Chitietdonhang(), request);

            donhangService.createDonhang(request);

            assertEquals(BigDecimal.valueOf(50), kho.getSoluongton(), "chưa trừ gì");
            verifyNoInteractions(chitietphieunhapRepository);
        }
    }

    // ===== Cân thực tế COD phải đồng bộ lại lô theo đúng phần chênh lệch =====
    @Nested
    class CapNhatCanThucTe {

        private Chitietdonhang chitietDonHangDangXuLy(Chitietcaban kho, BigDecimal duKien, BigDecimal thucTeCu) {
            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setTrangthaidonhang(TrangThaiDonHang.DANG_DONG_HANG);
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

            Chitietdonhang ctdh = new Chitietdonhang();
            ctdh.setIdchitietdonhang("ct-1");
            ctdh.setIddonhang(donhang);
            ctdh.setIdchitietcaban(kho);
            ctdh.setKhoiluongdukien(duKien);
            ctdh.setKhoiluongthucte(thucTeCu);
            ctdh.setTongtiendukien(BigDecimal.valueOf(1_000_000));
            when(chitietdonhangRepository.findById("ct-1")).thenReturn(Optional.of(ctdh));
            return ctdh;
        }

        @Test
        void canThucTeNangHonDuKien_truThemVaoLoTheoFIFO() {
            Chitietcaban kho = kho(BigDecimal.valueOf(100));
            chitietDonHangDangXuLy(kho, BigDecimal.valueOf(20), BigDecimal.valueOf(20));

            Chitietphieunhap loA = lo("lo-A", kho, LocalDate.of(2026, 1, 1),
                    BigDecimal.valueOf(30), BigDecimal.valueOf(30), TrangThaiCa.CON_HANG);
            when(chitietphieunhapRepository.findByIdchitietcabanAndSoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(
                    eq(kho), eq(BigDecimal.ZERO)))
                    .thenReturn(List.of(loA));

            UpdateCanNangRequest request = new UpdateCanNangRequest();
            request.setIdChitietdonhang("ct-1");
            request.setSoluongkgthucte(BigDecimal.valueOf(25)); // nặng hơn dự kiến 5kg

            donhangService.updateThucTeDonHang("dh-1", List.of(request));

            assertEquals(BigDecimal.valueOf(95), kho.getSoluongton(), "kho: hoàn 20 (100+20=120) rồi trừ 25 (120-25=95)");
            assertEquals(BigDecimal.valueOf(25), loA.getSoluongconlai(), "lô bị trừ thêm đúng phần chênh lệch: 30-5=25");
        }

        @Test
        void canThucTeNheHonDuKien_hoanTraVaoLoDaTru_khongHoanVaoLoThanhLy() {
            Chitietcaban kho = kho(BigDecimal.valueOf(50));
            chitietDonHangDangXuLy(kho, BigDecimal.valueOf(20), BigDecimal.valueOf(20));

            // Lô mới nhất đã thanh lý hết (không được hoàn vào đây); lô cũ hơn đã bị bán 1 phần (được hoàn vào đây)
            Chitietphieunhap loThanhLy = lo("lo-tl", kho, LocalDate.of(2026, 2, 1),
                    BigDecimal.valueOf(10), BigDecimal.ZERO, TrangThaiCa.THANH_LY);
            Chitietphieunhap loDaBan = lo("lo-ban", kho, LocalDate.of(2026, 1, 1),
                    BigDecimal.valueOf(30), BigDecimal.valueOf(10), TrangThaiCa.CON_HANG);
            when(chitietphieunhapRepository.findByIdchitietcabanOrderByIdphieunhap_NgaynhapDesc(kho))
                    .thenReturn(List.of(loThanhLy, loDaBan));

            UpdateCanNangRequest request = new UpdateCanNangRequest();
            request.setIdChitietdonhang("ct-1");
            request.setSoluongkgthucte(BigDecimal.valueOf(15)); // nhẹ hơn dự kiến 5kg

            donhangService.updateThucTeDonHang("dh-1", List.of(request));

            assertEquals(BigDecimal.ZERO, loThanhLy.getSoluongconlai(), "không hoàn vào lô đã thanh lý");
            assertEquals(BigDecimal.valueOf(15), loDaBan.getSoluongconlai(), "hoàn 5kg vào lô đã bán: 10+5=15");
            assertEquals(BigDecimal.valueOf(55), kho.getSoluongton(), "kho: hoàn 20 (50+20=70) rồi trừ 15 (70-15=55)");
        }
    }

    // ===== Hủy đơn: không cần hoàn gì cả, vì đơn còn CHO_XAC_NHAN nghĩa là chưa từng bị trừ kho/lô =====
    @Nested
    class HuyDonHang {

        @Test
        void huyDon_khongDungToiKhoVaLo_viChuaTruGiLucConChoXacNhan() {
            Taikhoan khach = dangNhap("kh-1", "khach@vuaca.vn");

            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setIdthongtinkhachhang(khach.getIdtaikhoan());
            donhang.setTrangthaidonhang(TrangThaiDonHang.CHO_XAC_NHAN);

            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

            donhangService.huyDonHang("dh-1");

            assertEquals(TrangThaiDonHang.HUY, donhang.getTrangthaidonhang());
            verifyNoInteractions(chitietdonhangRepository, chitietphieunhapRepository, chitietcabanRepository);
        }
    }

    // ===== Đổi trạng thái: trừ kho/lô đúng lúc đơn rời CHO_XAC_NHAN (COD/thanh toán sau/POS muộn) =====
    @Nested
    class CapNhatTrangThai {

        @Test
        void roiChoXacNhan_truNgayCaLoVaKhoTong() {
            Chitietcaban kho = kho(BigDecimal.valueOf(50));
            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setTrangthaidonhang(TrangThaiDonHang.CHO_XAC_NHAN);
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));
            when(donhangRepository.save(donhang)).thenReturn(donhang);

            Chitietdonhang ctdh = new Chitietdonhang();
            ctdh.setIdchitietcaban(kho);
            ctdh.setKhoiluongthucte(BigDecimal.valueOf(35));
            when(chitietdonhangRepository.findByIddonhang(donhang)).thenReturn(List.of(ctdh));

            Chitietphieunhap loCu = lo("lo-cu", kho, LocalDate.of(2026, 1, 1),
                    BigDecimal.valueOf(30), BigDecimal.valueOf(30), TrangThaiCa.CON_HANG);
            Chitietphieunhap loMoi = lo("lo-moi", kho, LocalDate.of(2026, 2, 1),
                    BigDecimal.valueOf(20), BigDecimal.valueOf(20), TrangThaiCa.CON_HANG);
            when(chitietphieunhapRepository.findByIdchitietcabanAndSoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(
                    eq(kho), eq(BigDecimal.ZERO)))
                    .thenReturn(List.of(loCu, loMoi));

            donhangService.updateStatus("dh-1", TrangThaiDonHang.DA_THANH_TOAN);

            assertEquals(BigDecimal.ZERO, loCu.getSoluongconlai());
            assertEquals(BigDecimal.valueOf(15), loMoi.getSoluongconlai());
            assertEquals(BigDecimal.valueOf(15), kho.getSoluongton(), "kho tổng: 50 - 35 = 15");
        }

        @Test
        void huyTuChoXacNhan_khongTruGi() {
            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setTrangthaidonhang(TrangThaiDonHang.CHO_XAC_NHAN);
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));
            when(donhangRepository.save(donhang)).thenReturn(donhang);

            donhangService.updateStatus("dh-1", TrangThaiDonHang.HUY);

            verifyNoInteractions(chitietdonhangRepository, chitietphieunhapRepository, chitietcabanRepository);
        }

        @Test
        void chuyenTiepKhongTuChoXacNhan_khongTruTrung() {
            // Đơn đã rời CHO_XAC_NHAN từ trước (ví dụ VNPAY tự chuyển DA_THANH_TOAN qua callback riêng)
            // -> chuyển tiếp tiếp theo không được trừ kho/lô lần nữa.
            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setTrangthaidonhang(TrangThaiDonHang.DA_THANH_TOAN);
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));
            when(donhangRepository.save(donhang)).thenReturn(donhang);

            donhangService.updateStatus("dh-1", TrangThaiDonHang.DANG_DONG_HANG);

            verifyNoInteractions(chitietdonhangRepository, chitietphieunhapRepository, chitietcabanRepository);
        }
    }

    // ===== Script đối soát dữ liệu cũ: đưa lô khớp lại với kho tổng =====
    @Nested
    class DongBoLaiTonKho {

        @Test
        void loCaoHonKho_truPhanLechTheoFIFO_dongBoKhopVoiKho() {
            Chitietcaban kho1 = kho(BigDecimal.valueOf(10)); // kho tổng đúng = 10kg còn lại thực tế
            Chitietphieunhap loCu = lo("lo-cu", kho1, LocalDate.of(2026, 1, 1),
                    BigDecimal.valueOf(20), BigDecimal.valueOf(20), TrangThaiCa.CON_HANG);
            Chitietphieunhap loMoi = lo("lo-moi", kho1, LocalDate.of(2026, 2, 1),
                    BigDecimal.valueOf(15), BigDecimal.valueOf(15), TrangThaiCa.CON_HANG);
            // Tổng lô = 35, kho = 10 -> lệch 25 (do bug COD để lại) -> cần trừ thêm 25 theo FIFO

            when(chitietcabanRepository.findAll()).thenReturn(List.of(kho1));
            when(chitietphieunhapRepository.findByIdchitietcabanAndSoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(
                    eq(kho1), eq(BigDecimal.ZERO)))
                    .thenReturn(List.of(loCu, loMoi));

            List<String> canhBao = donhangService.dongBoLaiTonKhoTheoLo();

            assertTrue(canhBao.isEmpty());
            assertEquals(BigDecimal.ZERO, loCu.getSoluongconlai());
            assertEquals(BigDecimal.valueOf(10), loMoi.getSoluongconlai());
            assertEquals(BigDecimal.valueOf(10), kho1.getSoluongton(), "kho tổng giữ nguyên, không đổi");
        }

        @Test
        void loThapHonKho_batThuong_boQuaKhongDungToiSave() {
            Chitietcaban kho1 = kho(BigDecimal.valueOf(20));
            when(chitietcabanRepository.findAll()).thenReturn(List.of(kho1));
            when(chitietphieunhapRepository.findByIdchitietcabanAndSoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(
                    eq(kho1), eq(BigDecimal.ZERO)))
                    .thenReturn(List.of());

            List<String> canhBao = donhangService.dongBoLaiTonKhoTheoLo();

            assertTrue(canhBao.isEmpty());
            verify(chitietphieunhapRepository, never()).save(any());
        }
    }
}
