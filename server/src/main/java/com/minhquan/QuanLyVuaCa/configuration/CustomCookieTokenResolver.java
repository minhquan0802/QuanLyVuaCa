package com.minhquan.QuanLyVuaCa.configuration;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.stereotype.Component;

@Component
public class CustomCookieTokenResolver implements BearerTokenResolver {
    @Override
    public String resolve(HttpServletRequest request) {
        // Các endpoint xác thực tự đọc và xác minh cookie cần thiết trong service.
        // Không để access token hỏng chặn /auth/csrf, /auth/refresh hoặc /auth/logout
        // trước khi request đi tới controller.
        String servletPath = request.getServletPath();
        if (servletPath != null && servletPath.startsWith("/auth/")) {
            return null;
        }

        // Ưu tiên Authorization header nếu request gửi Bearer token.
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            return token.isEmpty() ? null : token;
        }

        // Fallback: đọc access token từ cookie.
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("token".equals(cookie.getName())) {
                    String token = cookie.getValue();
                    return token == null || token.isBlank() ? null : token;
                }
            }
        }

        return null;
    }
}
