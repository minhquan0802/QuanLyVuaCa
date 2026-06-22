package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoHangResponse {
    String idchitietphieunhap;
    LocalDate ngaynhap;
    BigDecimal soluongnhap;
    BigDecimal soluongconlai;
    String trangthaica;
}
