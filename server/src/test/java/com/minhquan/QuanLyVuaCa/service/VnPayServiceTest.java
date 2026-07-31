package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.utils.VnPayUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VnPayServiceTest {

    @Mock Environment env;
    @Mock VnPayUtils utils;
    @Mock DonhangService donhangService;
    @Mock ThanhtoanService thanhtoanService;
    @Mock HttpServletRequest request;

    VnPayService service;

    @BeforeEach
    void setUp() {
        service = new VnPayService(env, utils, donhangService, thanhtoanService);
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

        verifyNoInteractions(thanhtoanService, donhangService);
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
    }

    @Test
    void callbackThanhCongChoThanhToanLucCheckout_xacNhanDungBienBan() throws Exception {
        callback("hop-le", "00", "CHECKOUT-tt-2", "hop-le");

        assertEquals(1, service.orderReturn(request));

        verify(thanhtoanService).xacNhanThanhToan("tt-2");
    }

    @Test
    void callbackThatBaiChoThanhToanLucCheckout_huyBienBanDangCho() throws Exception {
        callback("hop-le", "24", "CHECKOUT-tt-2", "hop-le");

        assertEquals(0, service.orderReturn(request));

        verify(thanhtoanService).huyBienBanVnpay("tt-2");
        verify(thanhtoanService, never()).xacNhanThanhToan(anyString());
    }

    @Test
    void callbackTxnRefKhongHopLe_khongXacNhanGiCa() throws Exception {
        callback("hop-le", "00", "khong-dung-tien-to", "hop-le");

        assertEquals(0, service.orderReturn(request));

        verifyNoInteractions(thanhtoanService, donhangService);
    }
}
