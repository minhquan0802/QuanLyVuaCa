package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.response.TinhTrangThanhToanResponse;
import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.entity.Thanhtoan;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToan;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToanDonHang;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.DonhangRepository;
import com.minhquan.QuanLyVuaCa.repository.ThanhtoanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ThanhtoanServiceTest {

    @Mock ThanhtoanRepository thanhtoanRepository;
    @Mock DonhangRepository donhangRepository;
    @Mock DonhangService donhangService;
    @Mock CongNoService congNoService;

    ThanhtoanService service;
    Donhang donhang;

    @BeforeEach
    void setUp() {
        service = new ThanhtoanService(thanhtoanRepository, donhangRepository, donhangService, congNoService);
        donhang = new Donhang();
        donhang.setIddonhang("dh-1");
        donhang.setTrangthaithanhtoan(TrangThaiThanhToanDonHang.CHUA_THANH_TOAN);
    }

    private Thanhtoan thanhToan(String id, String soTien, TrangThaiThanhToan trangThai) {
        Thanhtoan t = new Thanhtoan();
        t.setIdthanhtoan(id);
        t.setIddonhang(donhang);
        t.setSotien(new BigDecimal(soTien));
        t.setPhuongthuc("CHUYEN_KHOAN");
        t.setTrangthai(trangThai);
        return t;
    }

    @Test
    void tinhTrang_chiCongGiaoDichDaThanhToan() {
        when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));
        when(donhangService.tinhTongTienDonHang("dh-1")).thenReturn(new BigDecimal("1000"));
        when(thanhtoanRepository.findByIddonhang(donhang)).thenReturn(List.of(
                thanhToan("tt-1", "400", TrangThaiThanhToan.DA_THANH_TOAN),
                thanhToan("tt-2", "300", TrangThaiThanhToan.CHO_XAC_NHAN)));

        TinhTrangThanhToanResponse result = service.getTinhTrang("dh-1");

        assertEquals(0, new BigDecimal("400").compareTo(result.getDaTra()));
        assertEquals(0, new BigDecimal("600").compareTo(result.getConNo()));
        assertFalse(result.isDaThanhToanHet());
        assertEquals(2, result.getLichSuThanhToan().size());
    }

    @Test
    void chuyenKhoan_soTienBangKhongBiTuChoi() {
        when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

        AppExceptions ex = assertThrows(AppExceptions.class,
                () -> service.taoBienBanChuyenKhoan("dh-1", BigDecimal.ZERO, null));

        assertEquals(ErrorCode.SOTIEN_THANH_TOAN_KHONG_HOP_LE, ex.getErrorCode());
        verify(thanhtoanRepository, never()).save(any());
    }

    @Test
    void vnpay_soTienAmBiTuChoi() {
        when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

        AppExceptions ex = assertThrows(AppExceptions.class,
                () -> service.taoBienBanVnpay("dh-1", new BigDecimal("-1")));

        assertEquals(ErrorCode.SOTIEN_THANH_TOAN_KHONG_HOP_LE, ex.getErrorCode());
        verify(thanhtoanRepository, never()).deleteByIddonhangAndPhuongthucAndTrangthai(any(), any(), any());
        verify(thanhtoanRepository, never()).save(any());
    }

    @Test
    void chuyenKhoan_vuotSoTienConNo_duocGhiNhanLamSoDuTraTruoc() {
        when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));
        when(thanhtoanRepository.save(any(Thanhtoan.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Thanhtoan result = service.taoBienBanChuyenKhoan(
                "dh-1", new BigDecimal("301"), "Thanh toan du");

        assertSame(donhang, result.getIddonhang());
        assertEquals(0, new BigDecimal("301").compareTo(result.getSotien()));
        assertEquals("CHUYEN_KHOAN", result.getPhuongthuc());
        assertEquals(TrangThaiThanhToan.CHO_XAC_NHAN, result.getTrangthai());
        assertEquals("Thanh toan du", result.getGhichu());
        verify(thanhtoanRepository).save(result);
    }

    @Test
    void xacNhanLaiGiaoDichDaThanhToan_khongTruCongNoLanHai() {
        Thanhtoan daXacNhan = thanhToan("tt-1", "500", TrangThaiThanhToan.DA_THANH_TOAN);
        when(thanhtoanRepository.findById("tt-1")).thenReturn(Optional.of(daXacNhan));

        service.xacNhanThanhToan("tt-1");

        verify(congNoService, never()).xuLyThanhToanXacNhan(any());
        verify(thanhtoanRepository, never()).save(any());
    }

    @Test
    void xacNhanGiaoDichDangCho_chuyenTrangThaiVaXuLyCongNoMotLan() {
        Thanhtoan dangCho = thanhToan("tt-1", "500", TrangThaiThanhToan.CHO_XAC_NHAN);
        when(thanhtoanRepository.findById("tt-1")).thenReturn(Optional.of(dangCho));
        when(donhangService.tinhTongTienDonHang("dh-1")).thenReturn(new BigDecimal("1000"));
        when(thanhtoanRepository.findByIddonhangAndTrangthai(
                donhang, TrangThaiThanhToan.DA_THANH_TOAN))
                .thenReturn(List.of(dangCho));

        service.xacNhanThanhToan("tt-1");

        assertEquals(TrangThaiThanhToan.DA_THANH_TOAN, dangCho.getTrangthai());
        verify(thanhtoanRepository).save(dangCho);
        verify(congNoService).xuLyThanhToanXacNhan(dangCho);
        verify(donhangRepository, never()).save(any());
    }

    @Test
    void thanhToanThuCong_chiGhiNhanPhanConNo() {
        when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));
        when(donhangService.tinhTongTienDonHang("dh-1")).thenReturn(new BigDecimal("1000"));
        when(thanhtoanRepository.findByIddonhangAndTrangthai(donhang, TrangThaiThanhToan.DA_THANH_TOAN))
                .thenReturn(List.of(thanhToan("tt-cu", "400", TrangThaiThanhToan.DA_THANH_TOAN)));

        service.ghiNhanThanhToanThuCong("dh-1");

        ArgumentCaptor<Thanhtoan> captor = ArgumentCaptor.forClass(Thanhtoan.class);
        verify(thanhtoanRepository).save(captor.capture());
        assertEquals(0, new BigDecimal("600").compareTo(captor.getValue().getSotien()));
        assertEquals("TIEN_MAT", captor.getValue().getPhuongthuc());
        assertEquals(TrangThaiThanhToan.DA_THANH_TOAN, captor.getValue().getTrangthai());
        verify(congNoService).xuLyThanhToanXacNhan(captor.getValue());
        assertEquals(TrangThaiThanhToanDonHang.DA_THANH_TOAN, donhang.getTrangthaithanhtoan());
    }
}
