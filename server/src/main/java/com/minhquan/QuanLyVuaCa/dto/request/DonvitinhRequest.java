package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonvitinhRequest {
    @NotBlank(message = "DONVITINH_NAME_INVALID")
    @Size(max = 20, message = "DONVITINH_NAME_INVALID")
    private String tendvt;

    @NotNull(message = "HESOKG_INVALID")
    @DecimalMin(value = "0", message = "HESOKG_INVALID")
    private BigDecimal hesokg;

    @Size(max = 50, message = "INVALID_KEY")
    private String ghichu;
}
