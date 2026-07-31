package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CauHinhKichThuocVaGiaRequest {

    Integer idsizeca;
    String tensizemoi;

    @NotNull(message = "QUYDOI_INVALID")
    @DecimalMin(value = "0.01", message = "QUYDOI_INVALID")
    BigDecimal sokgtuongung;

    @NotNull(message = "GIABANLE_INVALID")
    BigDecimal giabanle;

    @NotNull(message = "GIABANSI_INVALID")
    BigDecimal giabansi;
}
