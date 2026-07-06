package com.minhquan.QuanLyVuaCa.dto.response;

import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToanDonHang;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DonhangResponse {
    String iddonhang;
    String idthongtinkhachhang;
    String tenKhachHang; // Thêm trường này
    String sdtKhachHang; // Thêm trường này
    LocalDateTime ngaydat;
    TrangThaiDonHang trangthaidonhang;
    TrangThaiThanhToanDonHang trangthaithanhtoan;
    BigDecimal tongtien;

    List<ChitietDonhangResponse> chiTietDonHangs;

    // Danh sách cảnh báo "giao thiếu" khi kho không đủ lúc bắt đầu đóng hàng (xem DonhangService.updateStatus)
    List<String> canhBaoGiaoThieu;
}