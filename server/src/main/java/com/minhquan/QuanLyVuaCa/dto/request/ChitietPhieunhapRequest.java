package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChitietPhieunhapRequest {

    @NotNull(message = "SIZECA_NOT_EXISTED")
    Integer idsizeca;

    @NotNull(message = "SOLUONG_NHAP_INVALID")
    @DecimalMin(value = "0.01", message = "SOLUONG_NHAP_INVALID")
    BigDecimal soluongnhap;

    @NotNull(message = "GIANHAP_INVALID")
    @DecimalMin(value = "0.01", message = "GIANHAP_INVALID")
    BigDecimal gianhap;

    @NotNull(message = "BANGGIA_BOTH_PRICES_REQUIRED")
    @DecimalMin(value = "0.01", message = "GIABANLE_INVALID")
    BigDecimal giabanletaithoidiemnhap;

    @NotNull(message = "BANGGIA_BOTH_PRICES_REQUIRED")
    @DecimalMin(value = "0.01", message = "GIABANSI_INVALID")
    BigDecimal giabansitaithoidiemnhap;
}
