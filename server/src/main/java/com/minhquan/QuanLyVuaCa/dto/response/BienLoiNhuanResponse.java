package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

// Dùng chung cho báo cáo theo sản phẩm và theo lô; trường không áp dụng sẽ để null.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BienLoiNhuanResponse {
    String tenLoaiCa;
    String tenSize;
    String idPhieuNhap;
    String idLo;
    LocalDate ngayNhap;
    BigDecimal soLuongBan;
    BigDecimal doanhThu;
    BigDecimal giaVon;
    BigDecimal loiNhuanGop;
    // loiNhuanGop / doanhThu, đơn vị %.
    BigDecimal bienLoiNhuan;
}
