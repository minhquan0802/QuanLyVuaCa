package com.minhquan.QuanLyVuaCa.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChitietDonhangRequest {
    // Chỉ gửi ID của khóa ngoại
    private String idchitietcaban;
    private String iddonvitinh;
    private Integer soluong;
    private BigDecimal soluongkgthucte;
    private BigDecimal soluongkgthuctequydoi;
    private BigDecimal tongtiendukien;
    private BigDecimal tongtienthucte;
}