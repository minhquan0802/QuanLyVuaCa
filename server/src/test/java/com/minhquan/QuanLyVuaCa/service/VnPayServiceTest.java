package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToanDonHang;
import com.minhquan.QuanLyVuaCa.repository.DonhangRepository;
import com.minhquan.QuanLyVuaCa.utils.VnPayUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VnPayServiceTest {

    @Mock Environment env;
    @Mock VnPayUtils utils;
    @Mock DonhangService donhangService;
    @Mock DonhangRepository donhangRepository;
    @Mock ThanhtoanService thanhtoanService;
    @Mock HttpServletRequest request;

    VnPayService service;

    @BeforeEach
    void setUp() {
        service = new VnPayService(env, utils, donhangService, donhangRepository, thanhtoanService);
    }

    private void callback(String secureHash, String responseCode, String txnRef, String calculatedHash) throws Exception {
        when(request.getParameterNames()).thenReturn(Collections.enumeration(Collections.emptyList()));
        when(request.getParameter("vnp_SecureHash")).thenReturn(secureHash);
        lenient().when(request.getParameter("vnp_ResponseCode")).thenReturn(responseCode);
        lenient().when(request.getParameter("vnp_TxnRef")).thenReturn(txnRef);
        when(env.getProperty("vnpay.hash-secret")).thenReturn("secret");
        when(utils.buildQuery(anyMap())).thenReturn("");
        when(utils.hmacSHA512("secret", "")).thenReturn(calculatedHash);
    }

    @Test
    void callbackSaiChuKy_khongCapNhatThanhToanHayDonHang() throws Exception {
        callback("chu-ky-gui-len", "00", "DEBT-tt-1", "chu-ky-tinh-lai");

        assertEquals(-1, service.orderReturn(request));

        verifyNoInteractions(thanhtoanService, donhangRepository, donhangService);
    }

    @Test
    void callbackThatBaiChoThanhToanCongNo_huyBienBanDangCho() throws Exception {
        callback("hop-le", "24", "DEBT-tt-1", "hop-le");

        assertEquals(0, service.orderReturn(request));

        verify(thanhtoanService).huyBienBanVnpay("tt-1");
        verify(thanhtoanService, never()).xacNhanThanhToan(anyString());
    }

    @Test
    void callbackThanhCongChoThanhToanCongNo_xacNhanDungBienBan() throws Exception {
        callback("hop-le", "00", "DEBT-tt-1", "hop-le");

        assertEquals(1, service.orderReturn(request));

        verify(thanhtoanService).xacNhanThanhToan("tt-1");
        verifyNoInteractions(donhangRepository, donhangService);
    }

    @Test
    void callbackThanhCongToanDon_capNhatTrangThaiVaTruKho() throws Exception {
        callback("hop-le", "00", "dh-1", "hop-le");
        Donhang donhang = new Donhang();
        donhang.setIddonhang("dh-1");
        donhang.setTrangthaidonhang(TrangThaiDonHang.CHO_XAC_NHAN);
        donhang.setTrangthaithanhtoan(TrangThaiThanhToanDonHang.CHUA_THANH_TOAN);
        when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

        assertEquals(1, service.orderReturn(request));

        assertEquals(TrangThaiDonHang.GIAO_HANG_THANH_CONG, donhang.getTrangthaidonhang());
        assertEquals(TrangThaiThanhToanDonHang.DA_THANH_TOAN, donhang.getTrangthaithanhtoan());
        verify(donhangRepository).save(donhang);
        verify(donhangService).truSoluongTon("dh-1");
    }

    @Test
    void callbackLapLaiChoDonDaThanhToan_khongTruKhoLanHai() throws Exception {
        callback("hop-le", "00", "dh-1", "hop-le");
        Donhang donhang = new Donhang();
        donhang.setIddonhang("dh-1");
        donhang.setTrangthaidonhang(TrangThaiDonHang.GIAO_HANG_THANH_CONG);
        donhang.setTrangthaithanhtoan(TrangThaiThanhToanDonHang.DA_THANH_TOAN);
        when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

        assertEquals(1, service.orderReturn(request));

        verify(donhangRepository, never()).save(any());
        verify(donhangService, never()).truSoluongTon(anyString());
    }

    @Test
    void callbackChoDonDaRoiChoXacNhan_khongTruKhoThem() throws Exception {
        callback("hop-le", "00", "dh-1", "hop-le");
        Donhang donhang = new Donhang();
        donhang.setIddonhang("dh-1");
        donhang.setTrangthaidonhang(TrangThaiDonHang.DANG_DONG_HANG);
        donhang.setTrangthaithanhtoan(TrangThaiThanhToanDonHang.CHUA_THANH_TOAN);
        when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

        assertEquals(1, service.orderReturn(request));

        assertEquals(TrangThaiDonHang.GIAO_HANG_THANH_CONG, donhang.getTrangthaidonhang());
        assertEquals(TrangThaiThanhToanDonHang.DA_THANH_TOAN, donhang.getTrangthaithanhtoan());
        verify(donhangRepository).save(donhang);
        verify(donhangService, never()).truSoluongTon(anyString());
    }

    @Test
    void callbackThatBaiToanDon_khongDoiTrangThaiVaKhongTruKho() throws Exception {
        callback("hop-le", "24", "dh-1", "hop-le");

        assertEquals(0, service.orderReturn(request));

        verifyNoInteractions(donhangRepository, donhangService, thanhtoanService);
    }
}
