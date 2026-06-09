package com.minhquan.QuanLyVuaCa.dto.request;

import lombok.Data;

@Data
public class PaymentVNPAYRequest {
    private String orderId;
    private String bankCode;
    private String language;
    // Tuỳ chọn: nếu null thì thanh toán toàn bộ đơn hàng, nếu có thì thanh toán một phần
    private java.math.BigDecimal soTienThanhToan;
}
