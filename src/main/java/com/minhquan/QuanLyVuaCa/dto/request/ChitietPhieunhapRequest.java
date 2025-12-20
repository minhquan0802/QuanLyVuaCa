package com.minhquan.QuanLyVuaCa.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;

@Slf4j
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChitietPhieunhapRequest {
    Integer idsizeca;
    BigDecimal soluongnhap;
    BigDecimal gianhap;
    BigDecimal giabanledukien; // Đổi tên cho rõ (map vào giabantaithoidiemnhap)
    BigDecimal giabansidukien; // Thêm trường này
}