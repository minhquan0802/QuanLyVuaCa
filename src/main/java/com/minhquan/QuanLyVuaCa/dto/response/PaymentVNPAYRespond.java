package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentVNPAYRespond {
    private String orderId;
    private String totalPrice;
    private String paymentTime;
    private String transactionId;
    private String status; // "00": Success
}