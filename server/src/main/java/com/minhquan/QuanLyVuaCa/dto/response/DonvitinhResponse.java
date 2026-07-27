package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonvitinhResponse {
    private Integer id;
    private String tendvt;
    private BigDecimal hesokg;
    private String ghichu;
}
