package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CapNhatHanMucRequest {
    @NotNull(message = "Vui lòng nhập hạn mức tín dụng")
    BigDecimal hanmuctindung;
}
