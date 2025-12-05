package com.minhquan.QuanLyVuaCa.dto.request;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiDonHang;

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
    List<ChitietDonhangRequest> chiTietDonHang;
}