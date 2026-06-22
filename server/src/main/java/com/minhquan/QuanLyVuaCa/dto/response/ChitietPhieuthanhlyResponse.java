package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChitietPhieuthanhlyResponse {
    String idchitietphieuthanhly;
    String tenLoaiCa;
    String tenSize;
    BigDecimal soluongthanhly;
    BigDecimal dongia;
    BigDecimal thanhtien;
}
