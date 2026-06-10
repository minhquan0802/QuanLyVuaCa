package com.minhquan.QuanLyVuaCa.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChitietGioHangResponse {

    String idchitietgiohang;
    Integer idchitietcaban;
    String tenLoaiCa;
    String tenSize;
    String hinhAnhUrl;
    Integer iddonvitinh;
    String tenDonViTinh;
    Integer soluong;
    BigDecimal khoiluongDuKien;
    BigDecimal giaBan;
    BigDecimal thanhTien;
}
