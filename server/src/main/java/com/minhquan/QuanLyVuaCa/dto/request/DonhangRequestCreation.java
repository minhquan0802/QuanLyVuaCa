package com.minhquan.QuanLyVuaCa.dto.request;

import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToanDonHang;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DonhangRequestCreation {
    String iddonhang;
    String idthongtinkhachhang;
    LocalDateTime ngaydat;
    TrangThaiDonHang trangthaidonhang;
    TrangThaiThanhToanDonHang trangthaithanhtoan;
    List<ChitietDonhangRequest> chiTietDonHang;
    String ghichu;
    String tenKhachLe;
    String sdtKhachLe;
}