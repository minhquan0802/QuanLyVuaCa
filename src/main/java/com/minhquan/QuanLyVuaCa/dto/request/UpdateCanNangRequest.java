package com.minhquan.QuanLyVuaCa.dto.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;

@Slf4j
@Data
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateCanNangRequest {
    String idChitietdonhang; // ID dòng chi tiết cần sửa
    BigDecimal soluongkgthucte;
}
