package com.minhquan.QuanLyVuaCa.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.minhquan.QuanLyVuaCa.dto.request.AuthenticationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.IntrospectRequest;
import com.minhquan.QuanLyVuaCa.dto.response.AuthenticationResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiTaiKhoan;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {
    private static final String EMAIL = "admin@vuaca.vn";
    private static final String SIGNER_KEY =
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    @Mock
    TaiKhoanRepository taiKhoanRepository;

    @Mock
    RedisTemplate<String, Object> redisTemplate;

    @Mock
    PasswordEncoder passwordEncoder;

    AuthenticationService authenticationService;
    Taikhoan taiKhoan;

    @BeforeEach
    void setUp() {
        authenticationService = new AuthenticationService(
                taiKhoanRepository,
                redisTemplate,
                passwordEncoder);
        ReflectionTestUtils.setField(authenticationService, "SIGNER_KEY", SIGNER_KEY);
        ReflectionTestUtils.setField(authenticationService, "TOKEN_TIME", 1800L);
        ReflectionTestUtils.setField(authenticationService, "REFRESH_TIME", 604800L);
        ReflectionTestUtils.setField(authenticationService, "COOKIE_SECURE", false);
        ReflectionTestUtils.setField(authenticationService, "COOKIE_SAME_SITE", "Lax");
        ReflectionTestUtils.setField(authenticationService, "CONTEXT_PATH", "/quan-ly-vua-ca");

        taiKhoan = Taikhoan.builder()
                .email(EMAIL)
                .matkhau("encoded-password")
                .trangthaitk(TrangThaiTaiKhoan.HOAT_DONG)
                .vaitro("ADMIN")
                .build();

        lenient().when(taiKhoanRepository.findByEmail(EMAIL)).thenReturn(Optional.of(taiKhoan));
        lenient().when(passwordEncoder.matches("password", "encoded-password")).thenReturn(true);
        lenient().when(redisTemplate.hasKey(anyString())).thenReturn(false);
    }

    @Test
    void authenticate_phanLoaiAccessVaRefreshToken() throws Exception {
        AuthenticationResponse response = authenticate();

        SignedJWT accessToken = SignedJWT.parse(response.getToken());
        SignedJWT refreshToken = SignedJWT.parse(response.getRefreshToken());

        assertEquals("access", accessToken.getJWTClaimsSet().getStringClaim("token_type"));
        assertEquals("refresh", refreshToken.getJWTClaimsSet().getStringClaim("token_type"));
        assertTrue(accessToken.getJWTClaimsSet().getExpirationTime()
                .before(refreshToken.getJWTClaimsSet().getExpirationTime()));
    }

    @Test
    void authenticationResponse_khongSerializeTokenRaJson() throws Exception {
        AuthenticationResponse response = authenticate();

        JsonNode json = new ObjectMapper().readTree(new ObjectMapper().writeValueAsString(response));

        assertTrue(json.get("authenticated").asBoolean());
        assertFalse(json.has("token"));
        assertFalse(json.has("refreshToken"));
    }

    @Test
    void refreshToken_tuChoiAccessToken() {
        AuthenticationResponse response = authenticate();

        assertThrows(AppExceptions.class,
                () -> authenticationService.refreshToken(response.getToken()));
    }

    @Test
    void introspect_tuChoiRefreshTokenLamAccessToken() {
        AuthenticationResponse response = authenticate();

        boolean valid = authenticationService.introspect(
                IntrospectRequest.builder().token(response.getRefreshToken()).build()).isValid();

        assertFalse(valid);
    }

    @Test
    void introspect_voHieuHoaTokenNgayKhiTaiKhoanBiKhoa() {
        AuthenticationResponse response = authenticate();
        taiKhoan.setTrangthaitk(TrangThaiTaiKhoan.KHOA);

        boolean valid = authenticationService.introspect(
                IntrospectRequest.builder().token(response.getToken()).build()).isValid();

        assertFalse(valid);
    }

    @Test
    void introspect_voHieuHoaTokenNgayKhiDoiQuyen() {
        AuthenticationResponse response = authenticate();
        taiKhoan.setVaitro("CUSTOMER");

        boolean valid = authenticationService.introspect(
                IntrospectRequest.builder().token(response.getToken()).build()).isValid();

        assertFalse(valid);
    }

    @Test
    void logout_khongBlacklistTokenSaiChuKy() {
        AuthenticationResponse response = authenticate();
        String[] tokenParts = response.getToken().split("\\.");
        char replacement = tokenParts[2].charAt(0) == 'A' ? 'B' : 'A';
        tokenParts[2] = replacement + tokenParts[2].substring(1);
        String forgedToken = String.join(".", tokenParts);

        authenticationService.logout(forgedToken, null);

        verify(redisTemplate, never()).opsForValue();
    }

    @Test
    void addCookie_thuHepPathCuaRefreshToken() {
        var cookies = authenticationService.addCookie("access", 1800, "refresh", 604800);

        assertEquals("/", cookies.getToken().getPath());
        assertEquals("/quan-ly-vua-ca/auth", cookies.getRefreshToken().getPath());
    }

    private AuthenticationResponse authenticate() {
        return authenticationService.authenticate(new AuthenticationRequest(EMAIL, "password"));
    }
}
