package com.minhquan.QuanLyVuaCa.configuration;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.stereotype.Component;

@Component
public class CustomCookieTokenResolver implements BearerTokenResolver {
    @Override
    public String resolve(HttpServletRequest request) {
        // Tìm trong giỏ Cookie của Request
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                // Nếu thấy cái Cookie tên là "token" (Access Token) thì lấy giá trị của nó đưa cho Spring Security
                if ("token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        // Nếu không có trả về null để báo là chưa đăng nhập
        return null;
    }
}
