package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PhieuthanhlyResponse {
    String idphieuthanhly;
    String tenNguoiTaoPhieu;
    Instant ngaythanhly;
    String lydothanhly;
    String trangthai;
    String ghichu;
    List<ChitietPhieuthanhlyResponse> listChiTiet;
}
