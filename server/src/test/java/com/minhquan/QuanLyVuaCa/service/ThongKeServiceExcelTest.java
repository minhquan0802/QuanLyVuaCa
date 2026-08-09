package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.response.LoHangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LuanChuyenHangHoaResponse;
import com.minhquan.QuanLyVuaCa.dto.response.ThongKeTongQuanResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.repository.ChitietdonhangRepository;
import com.minhquan.QuanLyVuaCa.repository.DonhangRepository;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ThongKeServiceExcelTest {

    @Mock PhieuthanhlyService phieuthanhlyService;
    @Mock DonhangRepository donhangRepository;
    @Mock ChitietdonhangRepository chitietdonhangRepository;
    @Mock TaiKhoanRepository taiKhoanRepository;

    ThongKeService service;

    @BeforeEach
    void setUp() {
        service = new ThongKeService(
                mock(com.minhquan.QuanLyVuaCa.repository.LoaicaRepository.class),
                mock(com.minhquan.QuanLyVuaCa.repository.ChitietcabanRepository.class),
                mock(com.minhquan.QuanLyVuaCa.repository.ChitietphieunhapRepository.class),
                chitietdonhangRepository,
                mock(com.minhquan.QuanLyVuaCa.repository.ChitietphieuthanhlyRepository.class),
                donhangRepository,
                taiKhoanRepository,
                phieuthanhlyService);

        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("admin@vuaca.vn");
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(context);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void xuatBaoCaoTaoDungBonSheetVaDuLieuCotLoi() throws Exception {
        LocalDateTime tuNgay = LocalDate.of(2026, 8, 1).atStartOfDay();
        LocalDateTime denNgay = LocalDate.of(2026, 8, 10).atStartOfDay().minusNanos(1);
        ThongKeService spyService = org.mockito.Mockito.spy(service);
        service = spyService;
        org.mockito.Mockito.doReturn(ThongKeTongQuanResponse.builder()
                .tongDoanhThu(new BigDecimal("1500000"))
                .thuTuBanThanhLy(new BigDecimal("100000"))
                .chiPhiNhapHang(new BigDecimal("900000"))
                .chiPhiNhapDaThanhToan(new BigDecimal("600000"))
                .donHoanThanh(3L)
                .soLoQuaHan(1L)
                .build()).when(spyService).tinhTongQuan("CUSTOM", tuNgay.toLocalDate(), denNgay.toLocalDate());
        org.mockito.Mockito.doReturn(List.of(LuanChuyenHangHoaResponse.builder()
                .name("Cá Điêu Hồng").nhap(new BigDecimal("100")).ban(new BigDecimal("70"))
                .banThanhLy(new BigDecimal("10")).tieuHuy(new BigDecimal("5"))
                .tonKho(new BigDecimal("15")).build()))
                .when(spyService).tinhLuanChuyenHangHoa("CUSTOM", tuNgay.toLocalDate(), denNgay.toLocalDate());
        when(donhangRepository.findByNgaydatBetweenOrderByNgaydatDesc(tuNgay, denNgay))
                .thenReturn(List.of());
        when(phieuthanhlyService.layDanhSachLoQuaHan()).thenReturn(List.of(
                LoHangResponse.builder()
                        .idchitietphieunhap("LO-001")
                        .tenLoaiCa("Cá Điêu Hồng")
                        .tenSize("0.8 - 1kg")
                        .ngaynhap(LocalDate.of(2026, 8, 1))
                        .soluongnhap(new BigDecimal("50"))
                        .soluongconlai(new BigDecimal("20"))
                        .gianhap(new BigDecimal("40000"))
                        .giabanleHienTai(new BigDecimal("60000"))
                        .giabansiHienTai(new BigDecimal("55000"))
                        .build()));

        Taikhoan admin = Taikhoan.builder()
                .ho("Nguyễn")
                .ten("An")
                .email("admin@vuaca.vn")
                .build();
        when(taiKhoanRepository.findByEmail("admin@vuaca.vn")).thenReturn(Optional.of(admin));
        when(taiKhoanRepository.findAllById(any())).thenReturn(List.of());

        ThongKeService.TepBaoCaoExcel result = service.xuatBaoCao(
                "CUSTOM", tuNgay.toLocalDate(), denNgay.toLocalDate());

        assertThat(result.tenTep()).isEqualTo("BaoCaoDashboard_2026-08-01_2026-08-09.xlsx");
        assertThat(result.noiDung()).isNotEmpty();
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(result.noiDung()))) {
            assertThat(workbook.getNumberOfSheets()).isEqualTo(4);
            assertThat(workbook.getSheetName(0)).isEqualTo("Tổng quan");
            assertThat(workbook.getSheetName(1)).isEqualTo("Luân chuyển hàng hóa");
            assertThat(workbook.getSheetName(2)).isEqualTo("Chi tiết đơn hàng");
            assertThat(workbook.getSheetName(3)).isEqualTo("Lô hàng quá hạn");
            assertThat(workbook.getSheet("Tổng quan").getRow(8).getCell(1).getNumericCellValue())
                    .isEqualTo(1_500_000D);
            assertThat(workbook.getSheet("Luân chuyển hàng hóa").getRow(6).getCell(0).getStringCellValue())
                    .isEqualTo("Cá Điêu Hồng");
            assertThat(workbook.getSheet("Lô hàng quá hạn").getRow(6).getCell(0).getStringCellValue())
                    .isEqualTo("LO-001");
        }
    }
}
