package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NhatKyThaoTacResponse {
    String idnhatky;
    String tenbang;
    String idbanghi;
    String hanhdong;
    String giatricu;
    String giatrimoi;
    String tenNguoiThucHien;
    String emailNguoiThucHien;
    String diachiip;
    String ghichu;
    Instant thoigian;
}
