package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.DecimalMin;
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
public class ChitietPhieuthanhlyRequest {
    @NotNull(message = "CHITIETPHIEUNHAP_NOT_EXISTED")
    String idchitietphieunhap;

    @NotNull(message = "SOLUONG_THANHLY_INVALID")
    @DecimalMin(value = "0", inclusive = false, message = "SOLUONG_THANHLY_INVALID")
    BigDecimal soluongthanhly;

    @NotNull(message = "DONGIA_THANHLY_INVALID")
    @DecimalMin(value = "0", message = "DONGIA_THANHLY_INVALID")
    BigDecimal dongia;
}
