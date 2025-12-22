package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;

@Slf4j
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChitietPhieunhapRequest {
    @NotNull(message = "Vui lòng chọn Size")
    Integer idsizeca;

    @NotNull(message = "Số lượng nhập không được để trống")
    @Min(value = 0, message = "Số lượng nhập phải lớn hơn 0")
    BigDecimal soluongnhap;

    @NotNull(message = "Giá nhập không được để trống")
    @Min(value = 0, message = "Giá nhập phải lớn hơn 0")
    BigDecimal gianhap;

    BigDecimal giabanletaithoidiemnhap;
    BigDecimal giabansitaithoidiemnhap;
}