package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LuanChuyenHangHoaResponse {
    String name;
    BigDecimal nhap;
    BigDecimal ban;
    BigDecimal banThanhLy;
    BigDecimal tieuHuy;
    BigDecimal tonKho;
}
