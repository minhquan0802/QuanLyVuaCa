package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChitietDonhangResponse {
    String idchitietdonhang;
    Integer idchitietcaban;
    String tenLoaiCa; // "Cá Điêu Hồng"
    String tenSize;   // "1kg - 2kg"
    Integer soluong;
    BigDecimal dongia;
    BigDecimal tongtiendukien;
}