package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.PaymentVNPAYRequest;
import com.minhquan.QuanLyVuaCa.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // Cho phép Frontend gọi
public class PaymentController {

    private final VnPayService vnPayService;

    // API 1: Tạo URL thanh toán
    // Frontend gọi API này sau khi đã tạo đơn hàng thành công và có orderId
    @PostMapping("/create-payment")
    public ResponseEntity<?> createPayment(@RequestBody PaymentVNPAYRequest paymentVNPAYRequest, HttpServletRequest request) {
        try {
            String paymentUrl = vnPayService.createPaymentUrl(paymentVNPAYRequest, request);

            Map<String, String> response = new HashMap<>();
            response.put("paymentUrl", paymentUrl);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi tạo thanh toán: " + e.getMessage());
        }
    }

    // API 2: Xử lý Callback từ VNPAY (Return URL)
    @GetMapping("/vnpay-callback")
    public void vnpayCallback(HttpServletRequest request, HttpServletResponse response) throws IOException {

        // 1. Gọi Service để kiểm tra hash và update DB
        int status = vnPayService.orderReturn(request);

        String orderId = request.getParameter("vnp_TxnRef");
        String totalPrice = request.getParameter("vnp_Amount");
        String transactionTime = request.getParameter("vnp_PayDate");

        // 2. Điều hướng về Frontend dựa trên kết quả
        if (status == 1) {
            // Thành công -> Về trang Success
            String redirectUrl = String.format(
                    "http://localhost:3000/order-success?orderId=%s&totalPrice=%s&time=%s",
                    orderId, totalPrice, transactionTime
            );
            response.sendRedirect(redirectUrl);
        } else {
            // Thất bại -> Về trang Failed
            String redirectUrl = "http://localhost:3000/order-failed?error=" +
                    URLEncoder.encode("Thanh toán thất bại", StandardCharsets.UTF_8);
            response.sendRedirect(redirectUrl);
        }
    }
}