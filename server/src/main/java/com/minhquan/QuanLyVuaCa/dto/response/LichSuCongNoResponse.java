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
public class LichSuCongNoResponse {
    String idlichsucongno;
    String loaithaydoi;
    BigDecimal sotien;
    BigDecimal sodusaukhithaydoi;
    String nguongocid;
    String nguongocloai;
    String tenNguoiThucHien;
    String ghichu;
    Instant ngaytao;
}
