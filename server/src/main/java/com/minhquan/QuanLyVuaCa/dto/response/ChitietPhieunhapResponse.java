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
public class ChitietPhieunhapResponse {
    String idchitietphieunhap;
    String tenSize; // Hiển thị tên size thay vì ID
    BigDecimal soluongnhap;
    BigDecimal gianhap;
    BigDecimal giabantaithoidiemnhap;
    BigDecimal soluongton;
    String trangthaica;
    LocalDate ngaythanhly;
}