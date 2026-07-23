package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ThongKeTongQuanResponse {
    BigDecimal tongDoanhThu;
    BigDecimal chiPhiNhapHang;
    BigDecimal thuTuBanThanhLy;
    Long donHoanThanh;
    Long soLoQuaHan;
}
