package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.*;
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
public class ChitietCabanCreationRequest {
    @NotNull(message = "Vui lòng chọn loại cá")
    Integer idloaica;

    @NotNull(message = "Vui lòng chọn size cá")
    Integer idsizeca;

    // Số lượng tồn ban đầu (thường là 0, nhưng có thể cho nhập nếu kiểm kê ban đầu)
    BigDecimal soluongton = BigDecimal.ZERO;
}