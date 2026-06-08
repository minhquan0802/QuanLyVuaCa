package com.minhquan.QuanLyVuaCa.configuration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Value("${frontend.url}")
    private String frontendUrl;

    private final String[] PUBLIC_POST_ENDPOINTS = {
            "/tai-khoan/**",
            "/auth/**",
    };

    @Autowired
    private CustomJwtDecoder customJwtDecoder;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity.authorizeHttpRequests(request ->
                request.requestMatchers(HttpMethod.POST, PUBLIC_POST_ENDPOINTS).permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated());

        httpSecurity.oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwtConfigurer ->
                        jwtConfigurer.decoder(customJwtDecoder)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter()))
                        .authenticationEntryPoint(new JwtAuthenticationEntryPoint())
                        .bearerTokenResolver(new CustomCookieTokenResolver())
        );
        httpSecurity.csrf(AbstractHttpConfigurer::disable);

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


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 1. CHỈ ĐỊNH CHÍNH XÁC DOMAIN CỦA VITE (Không được dùng "*")
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));

        // 2. CHO PHÉP CÁC METHOD CƠ BẢN
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // 3. CHO PHÉP CÁC HEADER CẦN THIẾT
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));

        // 4. QUAN TRỌNG NHẤT: Bật cờ cho phép đọc/ghi Cookie
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Áp dụng cho toàn bộ API
        return source;
    }

}

