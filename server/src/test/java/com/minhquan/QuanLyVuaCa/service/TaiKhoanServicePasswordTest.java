package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.TaikhoanMapper;
import com.minhquan.QuanLyVuaCa.repository.ChitietGioHangRepository;
import com.minhquan.QuanLyVuaCa.repository.GioHangRepository;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaiKhoanServicePasswordTest {
    private static final String EMAIL = "customer@vuaca.vn";
    private static final String ENCODED_PASSWORD = "encoded-password";

    @Mock
    TaiKhoanRepository taiKhoanRepository;
    @Mock
    TaikhoanMapper taiKhoanMapper;
    @Mock
    PasswordEncoder passwordEncoder;
    @Mock
    GioHangRepository gioHangRepository;
    @Mock
    ChitietGioHangRepository chitietGioHangRepository;
    @Mock
    EmailService emailService;
    @Mock
    CongNoService congNoService;
    @Mock
    PwnedPasswordService pwnedPasswordService;
    @Mock
    ThongBaoService thongBaoService;

    TaiKhoanService taiKhoanService;
    Taikhoan taiKhoan;

    @BeforeEach
    void setUp() {
        taiKhoanService = new TaiKhoanService(
                taiKhoanRepository,
                taiKhoanMapper,
                passwordEncoder,
                gioHangRepository,
                chitietGioHangRepository,
                emailService,
                congNoService,
                pwnedPasswordService,
                thongBaoService);
        taiKhoan = Taikhoan.builder()
                .email(EMAIL)
                .matkhau(ENCODED_PASSWORD)
                .build();
        when(taiKhoanRepository.findByEmail(EMAIL)).thenReturn(Optional.of(taiKhoan));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void datLaiMatKhau_tuChoiMatKhauTrungMatKhauHienTai() {
        when(emailService.getEmailByResetToken("reset-token")).thenReturn(EMAIL);
        when(passwordEncoder.matches("same-password", ENCODED_PASSWORD)).thenReturn(true);

        AppExceptions exception = assertThrows(
                AppExceptions.class,
                () -> taiKhoanService.datLaiMatKhau("reset-token", "same-password"));

        assertEquals(ErrorCode.NEW_PASSWORD_SAME_AS_OLD, exception.getErrorCode());
        verify(taiKhoanRepository, never()).save(taiKhoan);
        verify(emailService, never()).deleteResetToken("reset-token");
    }

    @Test
    void doiMatKhau_tuChoiMatKhauMoiTrungMatKhauHienTai() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(EMAIL, null));
        when(passwordEncoder.matches("old-password", ENCODED_PASSWORD)).thenReturn(true);
        when(passwordEncoder.matches("same-password", ENCODED_PASSWORD)).thenReturn(true);

        AppExceptions exception = assertThrows(
                AppExceptions.class,
                () -> taiKhoanService.doiMatKhau("old-password", "same-password"));

        assertEquals(ErrorCode.NEW_PASSWORD_SAME_AS_OLD, exception.getErrorCode());
        verify(taiKhoanRepository, never()).save(taiKhoan);
    }
}
