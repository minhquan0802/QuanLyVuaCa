package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DieuChinhCongNoRequest {
    @NotNull(message = "Vui lòng nhập số tiền")
    BigDecimal sotien;

    boolean tang;

    @NotBlank(message = "Vui lòng nhập lý do điều chỉnh")
    String ghichu;
}
