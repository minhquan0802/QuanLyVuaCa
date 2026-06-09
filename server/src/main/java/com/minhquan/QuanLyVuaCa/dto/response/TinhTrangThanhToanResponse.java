package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class TinhTrangThanhToanResponse {
    String iddonhang;
    BigDecimal tongTien;
    BigDecimal daTra;
    BigDecimal conNo;
    boolean daThanhToanHet;
    List<ThanhtoanItemResponse> lichSuThanhToan;
}
