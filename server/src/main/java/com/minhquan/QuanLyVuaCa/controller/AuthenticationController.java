package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.AuthenticationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.IntrospectRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.AuthenticationResponse;
import com.minhquan.QuanLyVuaCa.dto.response.IntrospectResponse;
import com.minhquan.QuanLyVuaCa.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService service;

    @NonFinal
    @Value("${jwt.valid-duration}")
    protected int TOKEN_TIME;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    protected int REFRESH_TIME;

    //login
    @PostMapping("/token")
    public ApiResponse<AuthenticationResponse> taoToken(@RequestBody AuthenticationRequest request,
                                                        HttpServletResponse response) {
        var result = service.authenticate(request);

        var cookieResult = service.addCookie(result.getToken(), TOKEN_TIME, result.getRefreshToken(), REFRESH_TIME);

        response.addCookie(cookieResult.getToken());
        response.addCookie(cookieResult.getRefreshToken());

        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }

    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> kiemTraToken(@CookieValue(value = "token", required = false) String token,
                                                        @CookieValue(value = "refreshToken", required = false) String refreshToken) {
        var tokenRequest = IntrospectRequest.builder().token(token).build();
        var tokenResult = service.introspect(tokenRequest);

        if (tokenResult.isValid()) {
            return ApiResponse.<IntrospectResponse>builder()
                    .result(tokenResult)
                    .build();
        }

        var refreshTokenRequest = IntrospectRequest.builder().token(refreshToken).build();
        var refreshTokenResult = service.introspect(refreshTokenRequest);

        return ApiResponse.<IntrospectResponse>builder()
                .result(IntrospectResponse.builder()
                        .valid(refreshTokenResult.isValid())
                        .build())
                .build();
    }

//    @PostMapping("/logout")
//    public ApiResponse<Void> logout(@CookieValue(value = "token", required = false) String token,
//                                    @CookieValue(value = "refreshToken", required = false) String refreshToken,
//                                    HttpServletResponse response) {
//        service.logout(token, refreshToken);
//
//        var cookieResult = service.addCookie(null, 0, null, 0);
//        response.addCookie(cookieResult.getToken());
//        response.addCookie(cookieResult.getRefreshToken());
//
//        return ApiResponse.<Void>builder()
//                .message("Đăng xuất thành công")
//                .build();
//    }


    @PostMapping("/logout")
    public ApiResponse<Void> logout(@CookieValue(value = "token", required = false) String token,
                                    @CookieValue(value = "refreshToken", required = false) String refreshToken,
                                    HttpServletResponse response) {

        // Xóa token trong database/blacklist (nếu có)
        service.logout(token, refreshToken);

        // 1. Tạo ResponseCookie "báo tử" cho token
        ResponseCookie deleteTokenCookie = ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(false) // Nếu bạn dùng https thì đổi thành true
                .path("/")
                .maxAge(0) // 0 có nghĩa là xóa ngay lập tức
                .sameSite("Lax") // CHI TIẾT QUAN TRỌNG NHẤT
                .build();

        // 2. Tạo ResponseCookie "báo tử" cho refreshToken
        ResponseCookie deleteRefreshCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        // 3. Gắn thẳng vào Header của response
        response.addHeader(HttpHeaders.SET_COOKIE, deleteTokenCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, deleteRefreshCookie.toString());

        return ApiResponse.<Void>builder()
                .message("Đăng xuất thành công")
                .build();
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthenticationResponse> refreshToken(@CookieValue(value = "refreshToken", required = false) String refreshToken,
                                                            HttpServletResponse response)
            throws ParseException, JOSEException {
        var result = service.refreshToken(refreshToken);

        var cookieResult = service.addCookie(result.getToken(), TOKEN_TIME, result.getRefreshToken(), REFRESH_TIME);

        response.addCookie(cookieResult.getToken());
        response.addCookie(cookieResult.getRefreshToken());

        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }
}
