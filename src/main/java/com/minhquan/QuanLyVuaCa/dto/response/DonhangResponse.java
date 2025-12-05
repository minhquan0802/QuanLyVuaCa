package com.minhquan.QuanLyVuaCa.dto.response;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiDonHang;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DonhangResponse {
    String iddonhang;
    String idthongtinkhachhang;
    LocalDateTime ngaydat;
    TrangThaiDonHang trangthaidonhang;
}