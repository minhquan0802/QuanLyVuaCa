package com.minhquan.QuanLyVuaCa.configuration;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.stereotype.Component;

@Component
public class CustomCookieTokenResolver implements BearerTokenResolver {
    @Override
    public String resolve(HttpServletRequest request) {
        // Ưu tiên Authorization header (axios luôn gửi header này)
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        // Fallback: đọc từ cookie (dùng khi gọi từ trình duyệt trực tiếp)
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }
}
