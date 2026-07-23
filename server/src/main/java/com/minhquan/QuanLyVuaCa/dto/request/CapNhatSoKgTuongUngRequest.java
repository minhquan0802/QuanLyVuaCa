package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CapNhatSoKgTuongUngRequest {
    @NotNull(message = "Vui lòng nhập số kg tương ứng")
    @DecimalMin(value = "0.01", message = "Số kg tương ứng phải lớn hơn 0")
    private BigDecimal sokgtuongung;
}
