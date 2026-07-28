package com.minhquan.QuanLyVuaCa.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthRateLimitFilterTest {
    @Mock
    StringRedisTemplate redisTemplate;

    @Mock
    FilterChain filterChain;

    AuthRateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new AuthRateLimitFilter(redisTemplate, new ObjectMapper());
        ReflectionTestUtils.setField(filter, "windowSeconds", 60L);
        ReflectionTestUtils.setField(filter, "loginLimit", 10L);
        ReflectionTestUtils.setField(filter, "refreshLimit", 30L);
        ReflectionTestUtils.setField(filter, "logoutLimit", 30L);
        ReflectionTestUtils.setField(filter, "csrfLimit", 60L);
    }

    @Test
    @SuppressWarnings("unchecked")
    void login_vuotGioiHanTraVe429() throws Exception {
        when(redisTemplate.execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)))
                .thenReturn(11L);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/token");
        request.setServletPath("/auth/token");
        request.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertEquals(429, response.getStatus());
        assertEquals("60", response.getHeader("Retry-After"));
        assertTrue(response.getContentAsString().contains("\"code\":1086"));
        verifyNoInteractions(filterChain);
    }

    @Test
    @SuppressWarnings("unchecked")
    void login_trongGioiHanChoRequestDiTiep() throws Exception {
        when(redisTemplate.execute(
                any(RedisScript.class),
                any(List.class),
                any(Object[].class)))
                .thenReturn(1L);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/token");
        request.setServletPath("/auth/token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertEquals("9", response.getHeader("X-RateLimit-Remaining"));
    }
}
