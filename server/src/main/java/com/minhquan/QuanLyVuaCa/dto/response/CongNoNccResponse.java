package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CongNoNccResponse {
    Integer idncc;
    String tenncc;
    String sodienthoai;
    String email;
    String diachi;
    String nguoilienhe;
    String masothue;
    // Số ngày NCC tự khai; null nghĩa là chưa khai.
    Integer hantramacdinh;
    // Số ngày thực sự được dùng khi lập phiếu nhập — bằng hantramacdinh, hoặc mặc định hệ thống
    // khi NCC chưa khai. Trả kèm để màn hình khỏi phải đoán.
    Integer hanTraApDung;
    BigDecimal congnophaitra;
    // Số phiếu nhập còn nợ và hạn trả gần nhất trong số đó — để admin biết cần xử lý cái nào trước.
    long soPhieuConNo;
    LocalDate hanTraGanNhat;
    boolean daQuaHan;
}
