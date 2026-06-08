package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.AuthenticationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.IntrospectRequest;
import com.minhquan.QuanLyVuaCa.dto.response.AuthenticationResponse;
import com.minhquan.QuanLyVuaCa.dto.response.CookieResponse;
import com.minhquan.QuanLyVuaCa.dto.response.IntrospectResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiTaiKhoan;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.http.Cookie;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    TaiKhoanRepository taiKhoanRepository;
    RedisTemplate<String, Object> redisTemplate;
    PasswordEncoder passwordEncoder;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    protected long TOKEN_TIME;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    protected long REFRESH_TIME;

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        var taiKhoan = taiKhoanRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        if (!passwordEncoder.matches(request.getPassword(), taiKhoan.getMatkhau()))
            throw new AppExceptions(ErrorCode.UNAUTHENTICATED);

        if (TrangThaiTaiKhoan.KHOA.equals(taiKhoan.getTrangthaitk()))
            throw new AppExceptions(ErrorCode.ACCOUNT_LOCKED);

        String token = generateToken(taiKhoan, TOKEN_TIME);
        String refreshToken = generateToken(taiKhoan, REFRESH_TIME);

        return AuthenticationResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .authenticated(true)
                .build();
    }

    public AuthenticationResponse refreshToken(String refreshToken) throws ParseException, JOSEException {
        // Kiểm tra null trước khi kiểm tra rỗng
        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new AppExceptions(ErrorCode.UNAUTHENTICATED);
        }

        var signJwt = verifyToken(refreshToken);

        invalidateToken(signJwt);

        var email = signJwt.getJWTClaimsSet().getSubject();
        var taiKhoan = taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        if (TrangThaiTaiKhoan.KHOA.equals(taiKhoan.getTrangthaitk()))
            throw new AppExceptions(ErrorCode.ACCOUNT_LOCKED);

        String newToken = generateToken(taiKhoan, TOKEN_TIME);
        String newRefreshToken = generateToken(taiKhoan, REFRESH_TIME);

        return AuthenticationResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .authenticated(true)
                .build();
    }

    public void logout(String token, String refreshToken) {
        try {
            if (token != null){
                SignedJWT parseToken = SignedJWT.parse(token);
                invalidateToken(parseToken);
            }

            if (refreshToken != null){
                SignedJWT parseRefreshToken = SignedJWT.parse(refreshToken);
                invalidateToken(parseRefreshToken);
            }

        } catch (Exception e) {
            log.error("Token đã không hợp lệ hoặc cấu trúc lỗi", e);
        }
    }

    public IntrospectResponse introspect(IntrospectRequest request) {
        var token = request.getToken();
        boolean isValid = true;
        try {
            verifyToken(token);
        } catch (Exception e) {
            isValid = false;
        }
        return IntrospectResponse.builder().valid(isValid).build();
    }

    private String generateToken(Taikhoan taikhoan, long duration) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(taikhoan.getEmail())
                .issuer("QuanLyVuCa_React_SpringBoot.com")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(duration, ChronoUnit.SECONDS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("role", buildScope(taikhoan))
                .build();

        Payload payload = new Payload(claimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);

        //Ky token
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Can not create token", e);
            throw new RuntimeException(e);
        }
    }

    private SignedJWT verifyToken(String token) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        var verify = signedJWT.verify(verifier);

        if (!(verify && expirationTime.after(new Date())))
            throw new AppExceptions(ErrorCode.UNAUTHENTICATED);

        String jwtId = signedJWT.getJWTClaimsSet().getJWTID();
        Boolean isBlacklisted = redisTemplate.hasKey("blacklist:" + jwtId);

        if (isBlacklisted) {
            throw new AppExceptions(ErrorCode.BLACKLIST);
        }

        return signedJWT;
    }

    private void invalidateToken(SignedJWT signToken) throws ParseException {
        String jwtId = signToken.getJWTClaimsSet().getJWTID();
        Date expirationTime = signToken.getJWTClaimsSet().getExpirationTime();

        long expiryTimeInSeconds = (expirationTime.getTime() - System.currentTimeMillis()) / 1000;

        if (expiryTimeInSeconds > 0) {
            redisTemplate.opsForValue().set(
                    "blacklist:" + jwtId,
                    "true",
                    Duration.ofSeconds(expiryTimeInSeconds)
            );
            log.info("Token {} đã được đưa vào Redis Blacklist", jwtId);
        }
    }

    private String buildScope(Taikhoan taikhoan) {
        StringJoiner stringJoiner = new StringJoiner(" ");
        if (taikhoan.getVaitro() != null && !taikhoan.getVaitro().isEmpty())
            stringJoiner.add("ROLE_" + taikhoan.getVaitro());
        return stringJoiner.toString();
    }

    public CookieResponse addCookie(String token, int tokenTime, String refreshToken, int refreshTokenTime) {
        Cookie tokenCookie = new Cookie("token", token);
        Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);

        tokenCookie.setHttpOnly(true);
        tokenCookie.setSecure(false);
        tokenCookie.setMaxAge(tokenTime);
        tokenCookie.setPath("/");

        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false);
        refreshTokenCookie.setMaxAge(refreshTokenTime);
        refreshTokenCookie.setPath("/");

        return CookieResponse.builder()
                .token(tokenCookie)
                .refreshToken(refreshTokenCookie)
                .build();
    }
}
