package com.minhquan.QuanLyVuaCa.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmailService {

    JavaMailSender mailSender;
    RedisTemplate<String, Object> redisTemplate;

    @NonFinal
    @Value("${frontend.url}")
    String frontendUrl;

    @NonFinal
    @Value("${spring.mail.username}")
    String fromEmail;

    private static final String TOKEN_PREFIX = "email_verify:";
    private static final String RESET_TOKEN_PREFIX = "password_reset:";

    // --- Token Redis ---

    public void saveVerifyToken(String email, String token) {
        redisTemplate.opsForValue().set(TOKEN_PREFIX + token, email, Duration.ofHours(24));
    }

    public String getEmailByToken(String token) {
        Object val = redisTemplate.opsForValue().get(TOKEN_PREFIX + token);
        return val != null ? val.toString() : null;
    }

    public void deleteVerifyToken(String token) {
        redisTemplate.delete(TOKEN_PREFIX + token);
    }

    // --- Gửi mail ---

    public void sendVerificationEmail(String toEmail, String token) {
        String verifyLink = frontendUrl + "/xac-thuc-email?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("[Vựa cá điêu hồng] Xác thực tài khoản của bạn");
        message.setText(
            "Xin chào!\n\n" +
            "Cảm ơn bạn đã đăng ký tài khoản tại Vựa cá điêu hồng.\n\n" +
            "Vui lòng click vào link bên dưới để xác thực email:\n\n" +
            verifyLink + "\n\n" +
            "Link có hiệu lực trong 24 giờ.\n\n" +
            "Sau khi xác thực email, tài khoản của bạn sẽ được gửi tới quản trị viên để phê duyệt. " +
            "Chúng tôi sẽ thông báo khi tài khoản được kích hoạt.\n\n" +
            "Trân trọng,\nĐội ngũ Vựa cá điêu hồng"
        );

        mailSender.send(message);
    }

    public void sendWelcomeEmail(String toEmail, String hoTen, String token) {
        String setPasswordLink = frontendUrl + "/dat-lai-mat-khau?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("[Vựa cá điêu hồng] Tài khoản của bạn đã được tạo");
        message.setText(
            "Xin chào " + hoTen + "!\n\n" +
            "Quản trị viên đã tạo tài khoản cho bạn tại Vựa cá điêu hồng.\n\n" +
            "Thông tin đăng nhập:\n" +
            "  - Email: " + toEmail + "\n\n" +
            "Vui lòng click vào link bên dưới để tự đặt mật khẩu của bạn:\n\n" +
            setPasswordLink + "\n\n" +
            "Link có hiệu lực trong 24 giờ.\n\n" +
            "Sau khi đặt mật khẩu, bạn có thể đăng nhập và sử dụng hệ thống ngay.\n\n" +
            "Trân trọng,\nĐội ngũ Vựa cá điêu hồng"
        );

        mailSender.send(message);
    }

    // --- Reset password token ---

    public void saveResetToken(String email, String token) {
        redisTemplate.opsForValue().set(RESET_TOKEN_PREFIX + token, email, Duration.ofHours(1));
    }

    public void saveWelcomeToken(String email, String token) {
        redisTemplate.opsForValue().set(RESET_TOKEN_PREFIX + token, email, Duration.ofHours(24));
    }

    public String getEmailByResetToken(String token) {
        Object val = redisTemplate.opsForValue().get(RESET_TOKEN_PREFIX + token);
        return val != null ? val.toString() : null;
    }

    public void deleteResetToken(String token) {
        redisTemplate.delete(RESET_TOKEN_PREFIX + token);
    }

    public void sendResetPasswordEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/dat-lai-mat-khau?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("[Vựa cá điêu hồng] Đặt lại mật khẩu");
        message.setText(
            "Xin chào!\n\n" +
            "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\n" +
            "Click vào link bên dưới để đặt lại mật khẩu:\n\n" +
            resetLink + "\n\n" +
            "Link có hiệu lực trong 1 giờ.\n\n" +
            "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.\n\n" +
            "Trân trọng,\nĐội ngũ Vựa cá điêu hồng"
        );

        mailSender.send(message);
    }
}
