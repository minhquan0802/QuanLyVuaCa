package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BanggiaResponse {
    Integer id;
    Integer idChitietcaban;
    Integer idLoaiCa;
    String tenLoaiCa;
    String tenSize;
    BigDecimal giaBanLe;
    BigDecimal giaBanSi;
    LocalDate ngayBatDau;
    LocalDate ngayKetThuc;
    String trangThai;
}