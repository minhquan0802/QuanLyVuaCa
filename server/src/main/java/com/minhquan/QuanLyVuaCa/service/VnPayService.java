package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.PaymentVNPAYRequest;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.utils.VnPayUtils;
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
    ThanhtoanService thanhtoanService;

    // Tạo URL thanh toán
    public String createPaymentUrl(PaymentVNPAYRequest paymentVNPAYRequest, HttpServletRequest request) throws Exception {

        // 1. Xác định số tiền: dùng custom amount nếu có, ngược lại dùng tổng đơn hàng
        BigDecimal soTien;
        boolean TTMotLan = paymentVNPAYRequest.getSoTienThanhToan() != null;

        if (TTMotLan) {
            soTien = paymentVNPAYRequest.getSoTienThanhToan();
        } else {
            soTien = donhangService.tinhTongTienDonHang(paymentVNPAYRequest.getOrderId());
        }

        if (soTien.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppExceptions(ErrorCode.SOTIEN_THANH_TOAN_KHONG_HOP_LE);
        }

        // 2. Luôn tạo trước 1 bản ghi thanhtoan "chờ xác nhận", dùng idthanhtoan làm TxnRef.
        //    Tiền tố phân biệt ngữ cảnh nhưng dùng chung 1 cơ chế xác nhận (taoBienBanVnpay/xacNhanThanhToan):
        //    - CHECKOUT-: thanh toán ngay lúc đặt đơn mới ở trang checkout. Đơn vẫn đi qua luồng giao hàng
        //      bình thường (có cân thực tế) — khoản này chỉ nạp trước vào công nợ, không tự chốt đơn.
        //    - DEBT-: trả bớt công nợ cho 1 đơn cũ đã có sẵn.
        boolean laDatHangMoi = Boolean.TRUE.equals(paymentVNPAYRequest.getLaDatHangMoi());
        var bienBan = thanhtoanService.taoBienBanVnpay(paymentVNPAYRequest.getOrderId(), soTien);
        String vnp_TxnRef = (laDatHangMoi ? "CHECKOUT-" : "DEBT-") + bienBan.getIdthanhtoan();
        String vnp_OrderInfo = laDatHangMoi
                ? "Thanh toan don hang " + paymentVNPAYRequest.getOrderId()
                : "Thanh toan cong no don hang " + paymentVNPAYRequest.getOrderId();

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
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
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
                    String idThanhtoan = layIdThanhtoanTuTxnRef(txnRef);

                    if (idThanhtoan != null) {
                        try {
                            thanhtoanService.xacNhanThanhToan(idThanhtoan);
                        } catch (Exception e) {
                            System.err.println("LỖI XÁC NHẬN THANH TOÁN: " + e.getMessage());
                        }
                        return 1;
                    }
                } else {
                    // VNPAY trả về thất bại/hủy → xóa record pending
                    String idThanhtoanThatBai = layIdThanhtoanTuTxnRef(request.getParameter("vnp_TxnRef"));
                    if (idThanhtoanThatBai != null) {
                        thanhtoanService.huyBienBanVnpay(idThanhtoanThatBai);
                    }
                    return 0;
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

    // txnRef dạng "CHECKOUT-{idThanhtoan}" hoặc "DEBT-{idThanhtoan}" -> trả về idThanhtoan, null nếu không khớp
    private String layIdThanhtoanTuTxnRef(String txnRef) {
        if (txnRef == null) return null;
        if (txnRef.startsWith("CHECKOUT-")) return txnRef.substring("CHECKOUT-".length());
        if (txnRef.startsWith("DEBT-")) return txnRef.substring("DEBT-".length());
        return null;
    }
}
