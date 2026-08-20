package com.minhquan.QuanLyVuaCa.configuration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.net.URI;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurtyConfig {
    // Danh sach origin duoc phep goi API. Tach rieng khoi frontend.url vi frontend.url
    // con duoc PaymentController/EmailService dung lam base URL de dung link (chi 1 gia
    // tri, co the kem path), con CORS thi can nhieu gia tri va khong duoc kem path.
    @Value("${frontend.allowed-origins}")
    private String frontendAllowedOrigins;

    @Value("${cookie.secure}")
    private boolean cookieSecure;

    @Value("${cookie.same-site}")
    private String cookieSameSite;

    private final String[] PUBLIC_POST_ENDPOINTS = {
            "/tai-khoan/**",
            "/auth/**",
    };

    private final String[] PUBLIC_GET_ENDPOINTS = {
            "/Loaicas",
            "/Loaicas/*",
            "/Chitietcabans",
            "/Banggias",
            "/Donvitinhs",
            "/tai-khoan/verify-email",
            "/auth/csrf",
            "/payment/vnpay-callback",
    };

    @Autowired
    private JwtTokenDecoder jwtTokenDecoder;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity.authorizeHttpRequests(request ->
                request.requestMatchers(HttpMethod.POST, PUBLIC_POST_ENDPOINTS).permitAll()
                        .requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINTS).permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated());

        httpSecurity.oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwtConfigurer ->
                        jwtConfigurer.decoder(jwtTokenDecoder)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter()))
                        .authenticationEntryPoint(new JwtAuthenticationEntryPoint())
                        .bearerTokenResolver(new JwtCookieTokenResolver())
        );
        CookieCsrfTokenRepository csrfTokenRepository = new CookieCsrfTokenRepository();
        csrfTokenRepository.setCookieName("XSRF-TOKEN");
        csrfTokenRepository.setHeaderName("X-XSRF-TOKEN");
        csrfTokenRepository.setCookieCustomizer(cookie -> cookie
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/"));

        CsrfTokenRequestAttributeHandler csrfRequestHandler = new CsrfTokenRequestAttributeHandler();
        csrfRequestHandler.setCsrfRequestAttributeName(null);

        httpSecurity.csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository)
                .csrfTokenRequestHandler(csrfRequestHandler));

        // Đăng ký CORS vào Security Chain để nó biết dùng cấu hình bên dưới
        httpSecurity.cors(cors -> cors.configurationSource(corsConfigurationSource()));

        return httpSecurity.build();
    }


    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter(){
        JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        jwtGrantedAuthoritiesConverter.setAuthoritiesClaimName("role");
        jwtGrantedAuthoritiesConverter.setAuthorityPrefix("");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }

//    @Bean
//    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
//        CorsConfiguration corsConfiguration = new CorsConfiguration();
//
//        corsConfiguration.addAllowedOrigin(frontendUrl);
//        corsConfiguration.addAllowedMethod("*");
//        corsConfiguration.addAllowedHeader("*");
//        corsConfiguration.setAllowCredentials(true); // cho phép truyền Cookie
//
//        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//        source.registerCorsConfiguration("/**", corsConfiguration);
//
//        return source; // Trả về source thay vì new CorsFilter(source)
//    }


    /**
     * Origin theo chuẩn CORS chỉ gồm scheme + host + port. Biến môi trường có thể được
     * điền kèm path (vd GitHub Pages: https://user.github.io/QuanLyVuaCa) hoặc dấu "/"
     * cuối; nếu để nguyên thì sẽ không khớp header Origin của trình duyệt và request bị
     * chặn với thông báo "Invalid CORS request".
     */
    private static String chuanHoaOrigin(String value) {
        try {
            URI uri = URI.create(value);
            if (uri.getScheme() == null || uri.getHost() == null) {
                return value.replaceAll("/+$", "");
            }
            String origin = uri.getScheme() + "://" + uri.getHost();
            return uri.getPort() == -1 ? origin : origin + ":" + uri.getPort();
        } catch (IllegalArgumentException e) {
            return value.replaceAll("/+$", "");
        }
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 1. CHỈ ĐỊNH CHÍNH XÁC DOMAIN ĐƯỢC PHÉP GỌI API (Không được dùng "*")
        // frontend.allowed-origins đọc từ biến môi trường FRONTEND_ALLOWED_ORIGINS
        // (mặc định lấy theo FRONTEND_URL), hỗ trợ nhiều domain cách nhau bởi dấu phẩy
        // (vd: local dev + Render + GitHub Pages).
        List<String> allowedOrigins = Arrays.stream(frontendAllowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .map(SecurtyConfig::chuanHoaOrigin)
                .distinct()
                .toList();
        configuration.setAllowedOrigins(allowedOrigins);

        // 2. CHO PHÉP CÁC METHOD CƠ BẢN
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // 3. CHO PHÉP CÁC HEADER CẦN THIẾT
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-Requested-With",
                "X-XSRF-TOKEN"));
        configuration.setExposedHeaders(List.of("X-CSRF-TOKEN"));

        // 4. QUAN TRỌNG NHẤT: Bật cờ cho phép đọc/ghi Cookie
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Áp dụng cho toàn bộ API
        return source;
    }

}

