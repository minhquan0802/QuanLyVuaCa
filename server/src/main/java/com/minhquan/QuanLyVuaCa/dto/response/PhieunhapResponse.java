package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PhieunhapResponse {
    String idphieunhap;
    String tenNhaCungCap;
    String tenLoaiCa;
    LocalDate ngaynhap;
    BigDecimal tongsoluong;
    String trangthaithanhtoan;
    String ghichu;
}