package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NhacungcapResponse {
    private Integer id;
    private String tenncc;
    private String sodienthoai;
}
