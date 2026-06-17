package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuydoiResponse {
    private Integer id;
    private Integer idchitietcaban;
    private BigDecimal sokgtuongung;
}
