package com.minhquan.QuanLyVuaCa.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TaoBienBanThanhToanRequest {
    String iddonhang;
    BigDecimal sotien;
    String ghichu;
}
