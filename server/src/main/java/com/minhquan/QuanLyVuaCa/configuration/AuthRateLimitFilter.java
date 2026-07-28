package com.minhquan.QuanLyVuaCa.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@RequiredArgsConstructor
public class AuthRateLimitFilter extends OncePerRequestFilter {
    private static final DefaultRedisScript<Long> INCREMENT_SCRIPT = new DefaultRedisScript<>(
            """
            local current = redis.call('INCR', KEYS[1])
            if current == 1 then
                redis.call('EXPIRE', KEYS[1], ARGV[1])
            end
            return current
            """,
            Long.class);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${rate-limit.auth.window-seconds:60}")
    private long windowSeconds;

    @Value("${rate-limit.auth.login:10}")
    private long loginLimit;

    @Value("${rate-limit.auth.refresh:30}")
    private long refreshLimit;

    @Value("${rate-limit.auth.logout:30}")
    private long logoutLimit;

    @Value("${rate-limit.auth.csrf:60}")
    private long csrfLimit;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        Long limit = endpointLimits(request).get(request.getServletPath());
        if (limit == null || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String endpoint = request.getServletPath().replace('/', ':');
        String key = "rate-limit:auth:" + endpoint + ":" + clientIp(request);

        try {
            Long current = redisTemplate.execute(
                    INCREMENT_SCRIPT,
                    List.of(key),
                    String.valueOf(windowSeconds));

            response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            response.setHeader("X-RateLimit-Remaining",
                    String.valueOf(Math.max(0, limit - (current == null ? 0 : current))));

            if (current != null && current > limit) {
                writeRateLimitResponse(response);
                return;
            }
        } catch (RuntimeException exception) {
            // Authentication must remain available if only the rate-limit counter is unavailable.
            log.warn("Khong the kiem tra rate limit cho {}", request.getServletPath());
        }

        filterChain.doFilter(request, response);
    }

    private Map<String, Long> endpointLimits(HttpServletRequest request) {
        if ("GET".equalsIgnoreCase(request.getMethod()))
            return Map.of("/auth/csrf", csrfLimit);
        if (!"POST".equalsIgnoreCase(request.getMethod()))
            return Map.of();
        return Map.of(
                "/auth/token", loginLimit,
                "/auth/refresh", refreshLimit,
                "/auth/logout", logoutLimit);
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank())
            return forwardedFor.split(",")[0].trim();
        return request.getRemoteAddr();
    }

    private void writeRateLimitResponse(HttpServletResponse response) throws IOException {
        ErrorCode errorCode = ErrorCode.RATE_LIMIT_EXCEEDED;
        response.setStatus(errorCode.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(windowSeconds));
        objectMapper.writeValue(response.getWriter(), ApiResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build());
    }
}
