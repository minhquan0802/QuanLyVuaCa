package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.AuthenticationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.IntrospectRequest;
import com.minhquan.QuanLyVuaCa.dto.response.AuthenticationResponse;
import com.minhquan.QuanLyVuaCa.dto.response.CookieResponse;
import com.minhquan.QuanLyVuaCa.dto.response.IntrospectResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.enums.TokenType;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiTaiKhoan;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import org.springframework.http.ResponseCookie;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
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

    // Local dev (http, cùng site): Secure=false, SameSite=Lax.
    // Production (https, FE/BE khác domain trên Render): Secure=true, SameSite=None,
    // nếu không trình duyệt sẽ không gửi cookie cho request cross-site.
    @NonFinal
    @Value("${cookie.secure}")
    protected boolean COOKIE_SECURE;

    @NonFinal
    @Value("${cookie.same-site}")
    protected String COOKIE_SAME_SITE;

    @NonFinal
    @Value("${server.servlet.context-path:}")
    protected String CONTEXT_PATH;

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        var taiKhoan = taiKhoanRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        if (!passwordEncoder.matches(request.getPassword(), taiKhoan.getMatkhau()))
            throw new AppExceptions(ErrorCode.UNAUTHENTICATED);

        if (TrangThaiTaiKhoan.CHO_XAC_THUC_EMAIL.equals(taiKhoan.getTrangthaitk()))
            throw new AppExceptions(ErrorCode.ACCOUNT_PENDING_EMAIL);

        if (TrangThaiTaiKhoan.CHO_DUYET.equals(taiKhoan.getTrangthaitk()))
            throw new AppExceptions(ErrorCode.ACCOUNT_PENDING_APPROVAL);

        if (TrangThaiTaiKhoan.KHOA.equals(taiKhoan.getTrangthaitk()))
            throw new AppExceptions(ErrorCode.ACCOUNT_LOCKED);

        String token = generateToken(taiKhoan, TOKEN_TIME, TokenType.ACCESS);
        String refreshToken = generateToken(taiKhoan, REFRESH_TIME, TokenType.REFRESH);

        return AuthenticationResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .authenticated(true)
                .build();
    }

    public AuthenticationResponse refreshToken(String refreshToken) {
        // Kiểm tra null trước khi kiểm tra rỗng
        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new AppExceptions(ErrorCode.UNAUTHENTICATED);
        }

        String email;
        try {
            var signJwt = verifyToken(refreshToken, TokenType.REFRESH);
            invalidateToken(signJwt);
            email = signJwt.getJWTClaimsSet().getSubject();
        } catch (ParseException | JOSEException e) {
            // Token bị hỏng/sai định dạng (không parse được) -> coi như chưa đăng nhập,
            // không để lọt ra ngoài thành lỗi 500 chưa được xử lý.
            throw new AppExceptions(ErrorCode.UNAUTHENTICATED);
        }

        var taiKhoan = taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        if (TrangThaiTaiKhoan.KHOA.equals(taiKhoan.getTrangthaitk()))
            throw new AppExceptions(ErrorCode.ACCOUNT_LOCKED);

        String newToken = generateToken(taiKhoan, TOKEN_TIME, TokenType.ACCESS);
        String newRefreshToken = generateToken(taiKhoan, REFRESH_TIME, TokenType.REFRESH);

        return AuthenticationResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .authenticated(true)
                .build();
    }

    public void logout(String token, String refreshToken) {
        verifyAndInvalidate(token, TokenType.ACCESS);
        verifyAndInvalidate(refreshToken, TokenType.REFRESH);
    }

    public IntrospectResponse introspect(IntrospectRequest request) {
        var token = request.getToken();
        boolean isValid = true;
        try {
            verifyToken(token, TokenType.ACCESS);
        } catch (Exception e) {
            isValid = false;
        }
        return IntrospectResponse.builder().valid(isValid).build();
    }

    private String generateToken(Taikhoan taikhoan, long duration, TokenType tokenType) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(taikhoan.getEmail())
                .issuer("QuanLyVuCa_React_SpringBoot.com")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(duration, ChronoUnit.SECONDS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("role", buildScope(taikhoan))
                .claim("token_type", tokenType.getClaimValue())
                .claim("password_version", buildPasswordVersion(taikhoan.getMatkhau()))
                .build();

        Payload payload = new Payload(claimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);

        //Ky token
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Can not create token", e);
            throw new AppExceptions(ErrorCode.TOKEN_CREATION_FAILED, ErrorCode.TOKEN_CREATION_FAILED.getMessage(), e);
        }
    }

    private SignedJWT verifyToken(String token, TokenType expectedType) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        var verify = signedJWT.verify(verifier);

        if (!(verify && expirationTime != null && expirationTime.after(new Date())))
            throw new AppExceptions(ErrorCode.UNAUTHENTICATED);

        String tokenType = signedJWT.getJWTClaimsSet().getStringClaim("token_type");
        if (!expectedType.getClaimValue().equals(tokenType))
            throw new AppExceptions(ErrorCode.UNAUTHENTICATED);

        String jwtId = signedJWT.getJWTClaimsSet().getJWTID();
        if (jwtId == null || jwtId.isBlank())
            throw new AppExceptions(ErrorCode.UNAUTHENTICATED);

        Boolean isBlacklisted = redisTemplate.hasKey("blacklist:" + jwtId);

        if (isBlacklisted) {
            throw new AppExceptions(ErrorCode.BLACKLIST);
        }

        validateCurrentAccount(signedJWT);
        return signedJWT;
    }

    private void validateCurrentAccount(SignedJWT signedJWT) throws ParseException {
        String email = signedJWT.getJWTClaimsSet().getSubject();
        Taikhoan taiKhoan = taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.UNAUTHENTICATED));

        if (!TrangThaiTaiKhoan.HOAT_DONG.equals(taiKhoan.getTrangthaitk()))
            throw new AppExceptions(ErrorCode.UNAUTHENTICATED);

        String tokenRole = signedJWT.getJWTClaimsSet().getStringClaim("role");
        if (!buildScope(taiKhoan).equals(tokenRole))
            throw new AppExceptions(ErrorCode.UNAUTHENTICATED);

        String tokenPasswordVersion = signedJWT.getJWTClaimsSet().getStringClaim("password_version"); // so sánh lại mật khẩu khi thay đổi
        if (!buildPasswordVersion(taiKhoan.getMatkhau()).equals(tokenPasswordVersion))
            throw new AppExceptions(ErrorCode.UNAUTHENTICATED);
    }

    private void verifyAndInvalidate(String token, TokenType tokenType) {
        if (token == null || token.isBlank())
            return;

        try {
            invalidateToken(verifyToken(token, tokenType));
        } catch (Exception exception) {
            log.warn("Bo qua token {} khong hop le khi dang xuat", tokenType.getClaimValue());
        }
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

    private String buildPasswordVersion(String encodedPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(encodedPassword.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    public CookieResponse addCookie(String token, int tokenTime, String refreshToken, int refreshTokenTime) {
        ResponseCookie tokenCookie = ResponseCookie.from("token", token == null ? "" : token)
                .httpOnly(true)
                .secure(COOKIE_SECURE)
                .maxAge(tokenTime)
                .path("/")
                .sameSite(COOKIE_SAME_SITE)
                .build();

        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken == null ? "" : refreshToken)
                .httpOnly(true)
                .secure(COOKIE_SECURE)
                .maxAge(refreshTokenTime)
                .path(refreshCookiePath())
                .sameSite(COOKIE_SAME_SITE)
                .build();

        return CookieResponse.builder()
                .token(tokenCookie)
                .refreshToken(refreshTokenCookie)
                .build();
    }

    private String refreshCookiePath() {
        String normalizedContextPath = CONTEXT_PATH == null ? "" : CONTEXT_PATH.trim();
        if (normalizedContextPath.isEmpty() || "/".equals(normalizedContextPath))
            return "/auth";
        return normalizedContextPath.replaceAll("/+$", "") + "/auth";
    }
}
