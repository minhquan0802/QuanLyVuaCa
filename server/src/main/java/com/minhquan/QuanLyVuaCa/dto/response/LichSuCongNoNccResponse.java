package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LichSuCongNoNccResponse {
    String idlichsucongnoncc;
    String loaithaydoi;
    BigDecimal sotien;
    BigDecimal sodusaukhithaydoi;
    String nguongocid;
    String nguongocloai;
    String tenNguoiThucHien;
    String ghichu;
    Instant ngaytao;
}
