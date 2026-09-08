package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

/**
 * Tách bạch ba đại lượng mà Dashboard cũ gộp làm một:
 *  - chiPhiMuaHangTrongKy: tiền hàng nhập phát sinh trong kỳ (phần lớn còn nằm trong bể).
 *  - giaVonHangBan: chỉ phần cá thực sự đã xuất đi — đây mới là thứ được trừ khỏi doanh thu.
 *  - tienDaTraNcc: tiền thật đã chi ra cho nhà cung cấp, cộng từ các khoản thanh toán nên trả
 *    từng phần vẫn tính đúng (chỉ tiêu cũ lọc theo cờ nhị phân của phiếu nên luôn báo thiếu).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LaiLoTongQuanResponse {
    BigDecimal doanhThu;
    BigDecimal giaVonHangBan;
    BigDecimal loiNhuanGop;
    BigDecimal bienLoiNhuanGop;
    BigDecimal chiPhiMuaHangTrongKy;
    BigDecimal tienDaTraNcc;
    BigDecimal congNoNccConLai;
    BigDecimal thuTuBanThanhLy;
}
