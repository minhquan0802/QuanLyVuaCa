package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DieuChinhCongNoNccRequest {

    @NotNull(message = "Vui lòng nhập số tiền")
    BigDecimal sotien;

    boolean tang;

    @NotBlank(message = "Vui lòng nhập lý do điều chỉnh")
    String ghichu;
}
