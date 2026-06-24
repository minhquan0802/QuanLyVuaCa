package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.PaymentVNPAYRequest;
import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.DonhangRepository;
import com.minhquan.QuanLyVuaCa.utils.VnPayUtils;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VnPayService {

    Environment env;
    VnPayUtils utils;
    DonhangService donhangService;
    DonhangRepository donhangRepository;
    ThanhtoanService thanhtoanService;

    // Tạo URL thanh toán
    public String createPaymentUrl(PaymentVNPAYRequest paymentVNPAYRequest, HttpServletRequest request) throws Exception {

        // 1. Xác định số tiền: dùng custom amount nếu có, ngược lại dùng tổng đơn hàng
        BigDecimal soTien;
        boolean isPartialPayment = paymentVNPAYRequest.getSoTienThanhToan() != null
                && paymentVNPAYRequest.getSoTienThanhToan().compareTo(BigDecimal.ZERO) > 0;

        if (isPartialPayment) {
            soTien = paymentVNPAYRequest.getSoTienThanhToan();
        } else {
            soTien = donhangService.tinhTongTienDonHang(paymentVNPAYRequest.getOrderId());
        }

        if (soTien.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppExceptions(ErrorCode.SOTIEN_THANH_TOAN_KHONG_HOP_LE);
        }

        // 2. Với partial payment: tạo bản ghi thanhtoan trước, dùng idthanhtoan làm TxnRef
        //    Với full checkout: dùng orderId làm TxnRef (flow cũ)
        String vnp_TxnRef;
        if (isPartialPayment) {
            var bienBan = thanhtoanService.taoBienBanVnpay(paymentVNPAYRequest.getOrderId(), soTien);
            vnp_TxnRef = "DEBT-" + bienBan.getIdthanhtoan();
        } else {
            vnp_TxnRef = paymentVNPAYRequest.getOrderId();
        }

        // 3. Tính số tiền (VNPAY yêu cầu nhân 100 và ép kiểu long)
        long amount = soTien.multiply(BigDecimal.valueOf(100)).longValue();
        String vnp_IpAddr = utils.getIpAddress(request);
        String vnp_TmnCode = env.getProperty("vnpay.tmn-code");

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", env.getProperty("vnpay.version"));
        vnp_Params.put("vnp_Command", env.getProperty("vnpay.command"));
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount));
        vnp_Params.put("vnp_CurrCode", "VND");

        if (paymentVNPAYRequest.getBankCode() != null && !paymentVNPAYRequest.getBankCode().isEmpty()) {
            vnp_Params.put("vnp_BankCode", paymentVNPAYRequest.getBankCode());
        }

        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang: " + vnp_TxnRef);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");

        vnp_Params.put("vnp_ReturnUrl", env.getProperty("vnpay.return-url"));
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        vnp_Params.put("vnp_CreateDate", now.format(formatter));
        vnp_Params.put("vnp_ExpireDate", now.plusMinutes(15).format(formatter));

        String queryUrl = utils.buildQuery(vnp_Params);
        String vnp_SecureHash = utils.hmacSHA512(env.getProperty("vnpay.hash-secret"), queryUrl);

        return env.getProperty("vnpay.base-url") + "?" + queryUrl + "&vnp_SecureHash=" + vnp_SecureHash;
    }

    public int orderReturn(HttpServletRequest request) {
        Map<String, String> fields = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements();) {
            String fieldName = params.nextElement();
            String fieldValue = request.getParameter(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                fields.put(fieldName, fieldValue);
            }
        }

        String vnp_SecureHash = request.getParameter("vnp_SecureHash");
        if (fields.containsKey("vnp_SecureHashType")) {
            fields.remove("vnp_SecureHashType");
        }
        if (fields.containsKey("vnp_SecureHash")) {
            fields.remove("vnp_SecureHash");
        }

        try {
            // Tính toán lại chữ ký để so sánh
            String signValue = utils.hmacSHA512(env.getProperty("vnpay.hash-secret"), utils.buildQuery(fields));

            // 1. Kiểm tra chữ ký số (Bảo mật)
            if (signValue.equals(vnp_SecureHash)) {

                // 2. Kiểm tra trạng thái giao dịch từ VNPAY (00 = Thành công)
                if ("00".equals(request.getParameter("vnp_ResponseCode"))) {

                    String txnRef = request.getParameter("vnp_TxnRef");

                    if (txnRef.startsWith("DEBT-")) {
                        // --- PARTIAL PAYMENT FLOW ---
                        String idThanhtoan = txnRef.substring(5);
                        try {
                            thanhtoanService.xacNhanThanhToan(idThanhtoan);
                        } catch (Exception e) {
                            System.err.println("LỖI XÁC NHẬN THANH TOÁN: " + e.getMessage());
                        }
                        return 1;
                    } else {
                        // --- FULL CHECKOUT FLOW (flow cũ) ---
                        String orderId = txnRef;
                        Donhang donhang = donhangRepository.findById(orderId).orElse(null);

                        if (donhang != null) {
                            donhang.setTrangthaidonhang(TrangThaiDonHang.DA_THANH_TOAN);
                            donhangRepository.save(donhang);

                            try {
                                donhangService.truSoluongTon(orderId);
                            } catch (Exception e) {
                                System.err.println("LỖI TRỪ KHO (VNPAY): " + e.getMessage());
                            }
                            return 1;
                        }
                    }
                } else {
                    return 0; // Return 0: Giao dịch lỗi/Hủy
                }
            } else {
                return -1; // Return -1: Sai chữ ký
            }
        } catch (Exception e) {
            e.printStackTrace();
            return 0; // Lỗi hệ thống
        }
        return 0;
    }
}