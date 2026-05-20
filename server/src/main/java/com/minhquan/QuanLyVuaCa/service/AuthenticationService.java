package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.AuthenticationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.IntrospectRequest;
import com.minhquan.QuanLyVuaCa.dto.request.LogoutRequest;
import com.minhquan.QuanLyVuaCa.dto.request.RefreshRequest;
import com.minhquan.QuanLyVuaCa.dto.response.AuthenticationResponse;
import com.minhquan.QuanLyVuaCa.dto.response.IntrospectResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
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

    @NonFinal
    @Value("${jwt.absolute-duration}")
    protected long ABSOLUTE_DURATION;

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        var taiKhoan = taiKhoanRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        if (!passwordEncoder.matches(request.getPassword(), taiKhoan.getMatkhau()))
            throw new AppExceptions(ErrorCode.UNAUTHENTICATED);

        long authTime = System.currentTimeMillis();

        String token = generateToken(taiKhoan, TOKEN_TIME, authTime);
        String refreshToken = generateToken(taiKhoan, REFRESH_TIME, authTime);

        return AuthenticationResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .authenticated(true)
                .build();
    }

    public AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {
        var signJwt = verifyToken(request.getToken());

        long authTime = signJwt.getJWTClaimsSet().getLongClaim("auth_time");
        long absoluteDurationMs = ABSOLUTE_DURATION * 60 * 1000;

        if (System.currentTimeMillis() - authTime > absoluteDurationMs) {
            throw new AppExceptions(ErrorCode.ABSOLUTE_DURATION);
        }

        invalidateToken(signJwt);

        var email = signJwt.getJWTClaimsSet().getSubject();
        var taiKhoan = taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        String newToken = generateToken(taiKhoan, TOKEN_TIME, authTime);
        String newRefreshToken = generateToken(taiKhoan, REFRESH_TIME, authTime);

        return AuthenticationResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .authenticated(true)
                .build();
    }

    public void logout(LogoutRequest request) {
        try {
            SignedJWT signToken = SignedJWT.parse(request.getToken());
            invalidateToken(signToken);
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

    private String generateToken(Taikhoan taikhoan, long duration, long authTime) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(taikhoan.getEmail())
                .issuer("QuanLyVuCa_React_SpringBoot.com")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(duration, ChronoUnit.MINUTES).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("role", buildScope(taikhoan))
                .claim("auth_time", authTime)
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
        StringJoiner scopeJoiner = new StringJoiner(" ");
        if (taikhoan.getIdvaitro() != null && taikhoan.getIdvaitro().getTenvaitro() != null) {
            scopeJoiner.add(taikhoan.getIdvaitro().getTenvaitro());
        }
        return scopeJoiner.toString();
    }
}

