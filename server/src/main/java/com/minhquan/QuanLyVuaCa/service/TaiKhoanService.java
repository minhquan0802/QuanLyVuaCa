package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiTaiKhoan;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.TaikhoanMapper;
import com.minhquan.QuanLyVuaCa.repository.ChitietGioHangRepository;
import com.minhquan.QuanLyVuaCa.repository.GioHangRepository;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TaiKhoanService {
    TaiKhoanRepository taiKhoanRepository;
    TaikhoanMapper taikhoanMapper;
    PasswordEncoder passwordEncoder;
    GioHangRepository gioHangRepository;
    ChitietGioHangRepository chitietGioHangRepository;
    EmailService emailService;

    public TaikhoanResponse taoTaiKhoan(TaiKhoanCreationRequest request) {
        if (taiKhoanRepository.existsByEmail(request.getEmail()))
            throw new AppExceptions(ErrorCode.USER_EXISTED);

        Taikhoan taikhoan = taikhoanMapper.toTaikhoan(request);
        taikhoan.setMatkhau(passwordEncoder.encode(request.getMatkhau()));

        var auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null
                && !(auth instanceof AnonymousAuthenticationToken)
                && auth.getAuthorities().stream()
                       .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            taikhoan.setTrangthaitk(TrangThaiTaiKhoan.HOAT_DONG);
            taiKhoanRepository.save(taikhoan);

            if ("CUSTOMER".equals(request.getVaitro())) {
                String token = UUID.randomUUID().toString();
                String hoTen = request.getHo() + " " + request.getTen();
                emailService.saveWelcomeToken(taikhoan.getEmail(), token);
                try {
                    emailService.sendWelcomeEmail(taikhoan.getEmail(), hoTen, token);
                } catch (Exception e) {
                    log.error("Không thể gửi email chào mừng tới {}: {}", taikhoan.getEmail(), e.getMessage());
                }
            }
        } else {
            taikhoan.setTrangthaitk(TrangThaiTaiKhoan.CHO_XAC_THUC_EMAIL);
            taiKhoanRepository.save(taikhoan);

            String token = UUID.randomUUID().toString();
            emailService.saveVerifyToken(taikhoan.getEmail(), token);
            try {
                emailService.sendVerificationEmail(taikhoan.getEmail(), token);
            } catch (Exception e) {
                log.error("Không thể gửi email xác thực tới {}: {}", taikhoan.getEmail(), e.getMessage());
            }
        }

        return taikhoanMapper.toTaikhoanResponse(taikhoan);
    }

    public String guiLaiEmailXacThuc(String email) {
        Taikhoan taikhoan = taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        if (!TrangThaiTaiKhoan.CHO_XAC_THUC_EMAIL.equals(taikhoan.getTrangthaitk()))
            throw new AppExceptions(ErrorCode.EMAIL_TOKEN_INVALID);

        String token = UUID.randomUUID().toString();
        emailService.saveVerifyToken(email, token);
        emailService.sendVerificationEmail(email, token);

        return "Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.";
    }

    public String quenMatKhau(String email) {
        Taikhoan taikhoan = taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        if (TrangThaiTaiKhoan.KHOA.equals(taikhoan.getTrangthaitk()))
            throw new AppExceptions(ErrorCode.ACCOUNT_LOCKED);

        if (TrangThaiTaiKhoan.CHO_XAC_THUC_EMAIL.equals(taikhoan.getTrangthaitk()))
            throw new AppExceptions(ErrorCode.ACCOUNT_PENDING_EMAIL);

        String token = UUID.randomUUID().toString();
        emailService.saveResetToken(email, token);
        emailService.sendResetPasswordEmail(email, token);

        return "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.";
    }

    public String datLaiMatKhau(String token, String matkhauMoi) {
        String email = emailService.getEmailByResetToken(token);
        if (email == null)
            throw new AppExceptions(ErrorCode.RESET_TOKEN_INVALID);

        Taikhoan taikhoan = taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        taikhoan.setMatkhau(passwordEncoder.encode(matkhauMoi));
        taiKhoanRepository.save(taikhoan);
        emailService.deleteResetToken(token);

        return "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.";
    }

    public String xacThucEmail(String token) {
        String email = emailService.getEmailByToken(token);
        if (email == null)
            throw new AppExceptions(ErrorCode.EMAIL_TOKEN_INVALID);

        Taikhoan taikhoan = taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        if (!TrangThaiTaiKhoan.CHO_XAC_THUC_EMAIL.equals(taikhoan.getTrangthaitk()))
            throw new AppExceptions(ErrorCode.EMAIL_TOKEN_INVALID);

        taikhoan.setTrangthaitk(TrangThaiTaiKhoan.CHO_DUYET);
        taiKhoanRepository.save(taikhoan);
        emailService.deleteVerifyToken(token);

        return "Xác thực email thành công! Tài khoản đang chờ admin phê duyệt.";
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<TaikhoanResponse> layDanhSachChoDuyet() {
        return taiKhoanRepository.findByTrangthaitk(TrangThaiTaiKhoan.CHO_DUYET)
                .stream().map(taikhoanMapper::toTaikhoanResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public TaikhoanResponse duyetTaiKhoan(String id) {
        Taikhoan taikhoan = taiKhoanRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        if (!TrangThaiTaiKhoan.CHO_DUYET.equals(taikhoan.getTrangthaitk()))
            throw new AppExceptions(ErrorCode.UNCATEGORIZED);

        taikhoan.setTrangthaitk(TrangThaiTaiKhoan.HOAT_DONG);
        TaikhoanResponse response = taikhoanMapper.toTaikhoanResponse(taiKhoanRepository.save(taikhoan));

        try {
            emailService.sendApprovalEmail(taikhoan.getEmail(), taikhoan.getHo() + " " + taikhoan.getTen());
        } catch (Exception e) {
            log.error("Không thể gửi email phê duyệt tới {}: {}", taikhoan.getEmail(), e.getMessage());
        }

        return response;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public List<TaikhoanResponse> getTaiKhoans() {
        return taiKhoanRepository.findAll().stream().map(taikhoanMapper::toTaikhoanResponse).toList();
    }

    @PostAuthorize("returnObject.email == authentication.name")
    public TaikhoanResponse timTaiKhoan(String id) {
        return taikhoanMapper.toTaikhoanResponse(
                taiKhoanRepository.findById(id).orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    public TaikhoanResponse updateTaiKhoan(String idTaiKhoan, TaiKhoanUpdateRequest request) {
        Taikhoan taikhoan = taiKhoanRepository.findById(idTaiKhoan).orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));
        taikhoanMapper.updateTaikhoan(taikhoan, request);

        if (request.getMatkhau() != null && !request.getMatkhau().isEmpty()) {
            taikhoan.setMatkhau(passwordEncoder.encode(request.getMatkhau()));
        }

        return taikhoanMapper.toTaikhoanResponse(taiKhoanRepository.save(taikhoan));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void xoaTaiKhoan(String id) {
        gioHangRepository.findAllByIdtaikhoan_Idtaikhoan(id)
                .forEach(g -> {
                    chitietGioHangRepository.deleteByIdgiohang(g.getIdgiohang());
                    gioHangRepository.delete(g);
                });
        taiKhoanRepository.deleteById(id);
    }

    public String doiMatKhau(String matkhauCu, String matkhauMoi) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Taikhoan taikhoan = taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        if (!passwordEncoder.matches(matkhauCu, taikhoan.getMatkhau()))
            throw new AppExceptions(ErrorCode.WRONG_PASSWORD);

        taikhoan.setMatkhau(passwordEncoder.encode(matkhauMoi));
        taiKhoanRepository.save(taikhoan);
        return "Đổi mật khẩu thành công.";
    }

    public TaikhoanResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String email = context.getAuthentication().getName();
        Taikhoan tk = taiKhoanRepository.findByEmail(email).orElseThrow(
                () -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));
        return taikhoanMapper.toTaikhoanResponse(tk);
    }
}
