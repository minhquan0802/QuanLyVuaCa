package com.minhquan.QuanLyVuaCa.configuration;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;

import java.util.List;

@Component
public class JwtCookieTokenResolver implements BearerTokenResolver {

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    // Phải khớp với PUBLIC_GET_ENDPOINTS / PUBLIC_POST_ENDPOINTS trong SecurityConfig.
    // BearerTokenAuthenticationFilter chạy trước AuthorizationFilter: nếu token được resolve
    // ra nhưng xác thực fail (hết hạn/sai), nó trả 401 ngay lập tức bất kể endpoint có
    // permitAll hay không. Vì vậy các endpoint public không được resolve token từ cookie/header.
    private static final List<String> PUBLIC_GET_PATTERNS = List.of(
            "/Loaicas", "/Loaicas/**", "/Chitietcabans", "/Banggias", "/Donvitinhs",
            "/tai-khoan/verify-email", "/auth/csrf");

    private static final List<String> PUBLIC_POST_PATTERNS = List.of(
            "/tai-khoan/**", "/auth/**");

    @Override
    public String resolve(HttpServletRequest request) {
        if (isPublicRequest(request)) {
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

    private boolean isPublicRequest(HttpServletRequest request) {
        List<String> patterns = switch (request.getMethod()) {
            case "GET" -> PUBLIC_GET_PATTERNS;
            case "POST" -> PUBLIC_POST_PATTERNS;
            default -> List.of();
        };

        String path = request.getServletPath();
        return patterns.stream().anyMatch(pattern -> PATH_MATCHER.match(pattern, path));
    }
}
