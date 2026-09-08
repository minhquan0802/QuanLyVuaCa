package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class NhacungcapResponse {
    private Integer id;
    private String tenncc;
    private String sodienthoai;
    private String diachi;
    private String email;
    private String masothue;
    private String nguoilienhe;
    private Integer hantramacdinh;
    private BigDecimal congnophaitra;
}
