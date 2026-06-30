package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChitietDonhangResponse {
    String idchitietdonhang;
    Integer idchitietcaban;
    String tenLoaiCa;
    String tenSize;
    String hinhanhurl;
    Integer soluong;
    BigDecimal dongia;
    BigDecimal tongtiendukien;

    BigDecimal soluongkgthucte;
    BigDecimal soluongkgthuctequydoi;
    BigDecimal tongtienthucte;

   Integer iddonvitinh;
   String tenDonViTinh;
}