package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ThanhtoanItemResponse {
    String idthanhtoan;
    BigDecimal sotien;
    String phuongthuc;
    String trangthai;
    LocalDateTime ngaythanhtoan;
    String ghichu;
}
