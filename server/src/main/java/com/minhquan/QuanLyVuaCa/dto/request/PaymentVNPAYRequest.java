package com.minhquan.QuanLyVuaCa.dto.request;

import lombok.Data;

@Data
public class PaymentVNPAYRequest {
    private String orderId;
    private String bankCode;
    private String language;
}
