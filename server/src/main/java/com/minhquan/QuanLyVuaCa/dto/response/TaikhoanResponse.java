package com.minhquan.QuanLyVuaCa.dto.response;

import com.minhquan.QuanLyVuaCa.enums.TrangThaiTaiKhoan;
import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.Instant;

@Slf4j
@Data
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaikhoanResponse {
    String idtaikhoan;
    String ho;
    String ten;
    String matkhau;
    String email;
    String sodienthoai;
    String diachi;
    TrangThaiTaiKhoan trangthaitk;
    String vaitro;
    BigDecimal hanmuctindung;
    BigDecimal congnohientai;
    Instant ngayvuothanmuc;
    Boolean dangBiKhoa;
}
