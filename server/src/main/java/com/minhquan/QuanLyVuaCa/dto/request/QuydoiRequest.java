package com.minhquan.QuanLyVuaCa.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuydoiRequest {
    private Integer idchitietcaban;
    private BigDecimal sokgtuongung;
}
