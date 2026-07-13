package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DeXuatNhapHangResponse {
    Integer id;
    String name;
    BigDecimal tonKho;
    BigDecimal tocDoBan;
    BigDecimal deXuatNhap;
    String mucDo;
    BigDecimal giaDapUng;
}
