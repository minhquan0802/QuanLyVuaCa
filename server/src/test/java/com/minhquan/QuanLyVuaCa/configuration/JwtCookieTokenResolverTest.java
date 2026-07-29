package com.minhquan.QuanLyVuaCa.configuration;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class JwtCookieTokenResolverTest {
    private final JwtCookieTokenResolver resolver = new JwtCookieTokenResolver();

    @Test
    void authEndpoint_boQuaAccessTokenBiHong() {
        MockHttpServletRequest request =
                new MockHttpServletRequest("POST", "/quan-ly-vua-ca/auth/refresh");
        request.setContextPath("/quan-ly-vua-ca");
        request.setServletPath("/auth/refresh");
        request.setCookies(new Cookie("token", "access-token-bi-hong"));

        assertNull(resolver.resolve(request));
    }

    @Test
    void csrfEndpoint_boQuaAuthorizationHeaderBiHong() {
        MockHttpServletRequest request =
                new MockHttpServletRequest("GET", "/quan-ly-vua-ca/auth/csrf");
        request.setContextPath("/quan-ly-vua-ca");
        request.setServletPath("/auth/csrf");
        request.addHeader("Authorization", "Bearer access-token-bi-hong");

        assertNull(resolver.resolve(request));
    }

    @Test
    void protectedEndpoint_docAccessTokenTuCookie() {
        MockHttpServletRequest request =
                new MockHttpServletRequest("GET", "/quan-ly-vua-ca/gio-hang");
        request.setContextPath("/quan-ly-vua-ca");
        request.setServletPath("/gio-hang");
        request.setCookies(new Cookie("token", "access-token-hop-le"));

        assertEquals("access-token-hop-le", resolver.resolve(request));
    }

    @Test
    void protectedEndpoint_coiCookieRongLaKhongCoToken() {
        MockHttpServletRequest request =
                new MockHttpServletRequest("GET", "/quan-ly-vua-ca/gio-hang");
        request.setContextPath("/quan-ly-vua-ca");
        request.setServletPath("/gio-hang");
        request.setCookies(new Cookie("token", ""));

        assertNull(resolver.resolve(request));
    }

    @Test
    void protectedEndpoint_uuTienBearerTokenVaLoaiBoKhoangTrang() {
        MockHttpServletRequest request =
                new MockHttpServletRequest("GET", "/quan-ly-vua-ca/gio-hang");
        request.setContextPath("/quan-ly-vua-ca");
        request.setServletPath("/gio-hang");
        request.addHeader("Authorization", "Bearer   header-token   ");
        request.setCookies(new Cookie("token", "cookie-token"));

        assertEquals("header-token", resolver.resolve(request));
    }
}
