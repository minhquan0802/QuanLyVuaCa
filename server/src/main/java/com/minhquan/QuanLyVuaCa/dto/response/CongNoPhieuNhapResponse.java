package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

// Một dòng "chuyến hàng còn nợ" — cái mà cờ nhị phân trên Phieunhap không diễn tả được.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CongNoPhieuNhapResponse {
    String idphieunhap;
    String tenLoaiCa;
    LocalDate ngaynhap;
    LocalDate hantra;
    BigDecimal tongtien;
    BigDecimal daTra;
    BigDecimal conNo;
    String trangthaithanhtoan;
    boolean daQuaHan;
}
