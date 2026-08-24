package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

/**
 * Kết quả của thao tác "Đặt lại".
 *
 * boQua không phải chi tiết thừa: đơn cũ có thể chứa sản phẩm nay đã ngừng kinh doanh hoặc rút
 * bảng giá. Im lặng bỏ qua chúng thì khách tưởng đã đặt đủ giỏ cũ, tới lúc nhận hàng mới biết thiếu.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DatLaiDonHangResponse {
    GioHangResponse gioHang;
    int soDongDaThem;
    List<String> boQua;
}
