package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.response.LuanChuyenHangHoaResponse;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhLy;
import com.minhquan.QuanLyVuaCa.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ThongKeServiceTest {

    @Mock LoaicaRepository loaicaRepository;
    @Mock ChitietcabanRepository chitietcabanRepository;
    @Mock ChitietphieunhapRepository chitietphieunhapRepository;
    @Mock ChitietdonhangRepository chitietdonhangRepository;
    @Mock ChitietphieuthanhlyRepository chitietphieuthanhlyRepository;
    @Mock DonhangRepository donhangRepository;

    ThongKeService service;

    @BeforeEach
    void setUp() {
        service = new ThongKeService(loaicaRepository, chitietcabanRepository,
                chitietphieunhapRepository, chitietdonhangRepository,
                chitietphieuthanhlyRepository, donhangRepository);
    }

    @Test
    void luanChuyen_tachBanThanhLyTieuHuy_vaLayTonKhoHienTai() {
        Loaica loaiCa = new Loaica();
        loaiCa.setId(1);
        loaiCa.setTenloaica("Cá lóc");
        loaiCa.setDeleted(false);
        when(loaicaRepository.findAll()).thenReturn(List.of(loaiCa));
        when(chitietphieunhapRepository.tongSoLuongNhapTheoLoaiCa(eq(loaiCa), any(), any()))
                .thenReturn(new BigDecimal("20"));
        when(chitietdonhangRepository.tongSoLuongBanTheoLoaiCa(eq(loaiCa), eq(TrangThaiDonHang.GIAO_HANG_THANH_CONG), any(), any()))
                .thenReturn(new BigDecimal("7"));
        when(chitietphieuthanhlyRepository.tongSoLuongThanhLyTheoLoaiCaVaTrangThai(
                eq(loaiCa), eq(TrangThaiThanhLy.DA_BAN_THANH_LY), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("2"));
        when(chitietphieuthanhlyRepository.tongSoLuongThanhLyTheoLoaiCaVaTrangThai(
                eq(loaiCa), eq(TrangThaiThanhLy.DA_TIEU_HUY), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("1"));
        when(chitietcabanRepository.findByIdloaica(loaiCa)).thenReturn(List.of(
                Chitietcaban.builder().soluongton(new BigDecimal("4.5")).build(),
                Chitietcaban.builder().soluongton(new BigDecimal("5.5")).build()));

        List<LuanChuyenHangHoaResponse> result = service.tinhLuanChuyenHangHoa("TODAY", null, null);

        assertEquals(1, result.size());
        LuanChuyenHangHoaResponse row = result.getFirst();
        assertEquals(0, new BigDecimal("20").compareTo(row.getNhap()));
        assertEquals(0, new BigDecimal("7").compareTo(row.getBan()));
        assertEquals(0, new BigDecimal("2").compareTo(row.getBanThanhLy()));
        assertEquals(0, new BigDecimal("1").compareTo(row.getTieuHuy()));
        assertEquals(0, new BigDecimal("10.0").compareTo(row.getTonKho()));
    }

    @Test
    void khoangTuyChon_truyenDungNgayDauVaNgayCuoiVaoTruyVan() {
        service.tinhTongQuan("CUSTOM", LocalDate.of(2026, 4, 1), LocalDate.of(2026, 6, 30));

        ArgumentCaptor<LocalDate> fromCaptor = ArgumentCaptor.forClass(LocalDate.class);
        ArgumentCaptor<LocalDate> toCaptor = ArgumentCaptor.forClass(LocalDate.class);
        verify(chitietphieunhapRepository).tongTienNhapTrongKhoang(fromCaptor.capture(), toCaptor.capture());
        assertEquals(LocalDate.of(2026, 4, 1), fromCaptor.getValue());
        assertEquals(LocalDate.of(2026, 6, 30), toCaptor.getValue());
    }

    @Test
    void khoangTuyChonThieuNgay_biTuChoiTruocKhiTruyVan() {
        assertThrows(IllegalArgumentException.class,
                () -> service.tinhTongQuan("CUSTOM", null, LocalDate.of(2026, 6, 30)));
        verifyNoInteractions(chitietdonhangRepository, chitietphieunhapRepository,
                chitietphieuthanhlyRepository, donhangRepository);
    }

    @Test
    void ngayBatDauSauNgayKetThuc_biTuChoiTruocKhiTruyVan() {
        assertThrows(IllegalArgumentException.class,
                () -> service.tinhLuanChuyenHangHoa("CUSTOM", LocalDate.of(2026, 7, 2), LocalDate.of(2026, 7, 1)));
        verifyNoInteractions(loaicaRepository, chitietdonhangRepository, chitietphieunhapRepository,
                chitietphieuthanhlyRepository);
    }
}
