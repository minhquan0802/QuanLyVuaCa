package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CongNoKhachResponse {
    String idtaikhoan;
    String ho;
    String ten;
    String email;
    String sodienthoai;
    BigDecimal hanmuctindung;
    BigDecimal congnohientai;
    Instant ngayvuothanmuc;
    Boolean dangBiKhoa;
}
