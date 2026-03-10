package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.PaymentVNPAYRequest;
import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.repository.DonhangRepository;
import com.minhquan.QuanLyVuaCa.utils.VnPayUtils;
import com.minhquan.QuanLyVuaCa.Enum.TrangThaiDonHang;
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

    // Tạo URL thanh toán
    public String createPaymentUrl(PaymentVNPAYRequest paymentVNPAYRequest, HttpServletRequest request) throws Exception {

        // 1. [SỬA] Tính tổng tiền từ Service thay vì get từ Entity
        BigDecimal tongTienDonHang = donhangService.tinhTongTienDonHang(paymentVNPAYRequest.getOrderId());
        // Kiểm tra tiền hợp lệ
        if (tongTienDonHang.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền thanh toán không hợp lệ (<= 0)");
        }

        // 2. Tính số tiền (VNPAY yêu cầu nhân 100 và ép kiểu long)
        long amount = tongTienDonHang.multiply(BigDecimal.valueOf(100)).longValue();

        String vnp_TxnRef = paymentVNPAYRequest.getOrderId();
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

    // Xử lý kết quả trả về từ VNPAY
//    public int orderReturn(HttpServletRequest request) {
//        Map<String, String> fields = new HashMap<>();
//        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements();) {
//            String fieldName = params.nextElement();
//            String fieldValue = request.getParameter(fieldName);
//            if ((fieldValue != null) && (fieldValue.length() > 0)) {
//                fields.put(fieldName, fieldValue);
//            }
//        }
//
//        String vnp_SecureHash = request.getParameter("vnp_SecureHash");
//        if (fields.containsKey("vnp_SecureHashType")) {
//            fields.remove("vnp_SecureHashType");
//        }
//        if (fields.containsKey("vnp_SecureHash")) {
//            fields.remove("vnp_SecureHash");
//        }
//
//        try {
//            String signValue = utils.hmacSHA512(env.getProperty("vnpay.hash-secret"), utils.buildQuery(fields));
//
//            // 1. Kiểm tra chữ ký số (Bảo mật)
//            if (signValue.equals(vnp_SecureHash)) {
//
//                // 2. Kiểm tra trạng thái giao dịch từ VNPAY (00 = Thành công)
//                if ("00".equals(request.getParameter("vnp_ResponseCode"))) {
//
//                    String orderId = request.getParameter("vnp_TxnRef");
//
//                    // 3. Tìm đơn hàng trong DB
//                    Donhang donhang = donhangRepository.findById(orderId).orElse(null);
//
//                    if (donhang != null) {
//                        // 4. [LOGIC CẬP NHẬT TRẠNG THÁI]
//                        // Cập nhật thành HOAN_TAT (Đã thanh toán)
//                        donhang.setTrangthaidonhang(TrangThaiDonHang.DA_THANH_TOAN);
//                        donhangRepository.save(donhang);
//
//                        return 1; // Return 1: Thành công
//                    }
//                } else {
//                    return 0; // Return 0: Giao dịch lỗi/Hủy
//                }
//            } else {
//                return -1; // Return -1: Sai chữ ký (Có dấu hiệu giả mạo)
//            }
//        } catch (Exception e) {
//            e.printStackTrace();
//            return 0; // Lỗi hệ thống
//        }
//        return 0;
//    }

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

                    String orderId = request.getParameter("vnp_TxnRef");

                    // 3. Tìm đơn hàng trong DB
                    Donhang donhang = donhangRepository.findById(orderId).orElse(null);

                    if (donhang != null) {
                        // 4. [LOGIC CẬP NHẬT TRẠNG THÁI]
                        donhang.setTrangthaidonhang(TrangThaiDonHang.DA_THANH_TOAN);
                        donhangRepository.save(donhang);

                        // 5. [MỚI] GỌI HÀM TRỪ TỒN KHO SAU KHI THANH TOÁN THÀNH CÔNG
                        try {
                            donhangService.truSoluongTon(orderId);
                            System.out.println("VNPAY: Đã trừ tồn kho cho đơn hàng " + orderId);
                        } catch (Exception e) {
                            // Nếu trừ kho lỗi (ví dụ hết hàng lúc đang thanh toán), cần log lại để xử lý hoàn tiền
                            System.err.println("LỖI TRỪ KHO (VNPAY): " + e.getMessage());
                            // Tùy nghiệp vụ: Có thể set trạng thái đơn hàng về lại CHO_XAC_NHAN hoặc HUY
                        }

                        return 1; // Return 1: Thành công
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