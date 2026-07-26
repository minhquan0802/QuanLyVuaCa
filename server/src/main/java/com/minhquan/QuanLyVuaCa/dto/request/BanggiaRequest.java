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
public class BanggiaRequest {
    @NotNull(message = "CHITIET_CABAN_NOT_EXISTED")
    Integer idchitietcaban;

    @NotNull(message = "GIABANLE_INVALID")
    @DecimalMin(value = "0.01", message = "GIABANLE_INVALID")
    BigDecimal giabanle;

    @NotNull(message = "GIABANSI_INVALID")
    @DecimalMin(value = "0.01", message = "GIABANSI_INVALID")
    BigDecimal giabansi;
}
