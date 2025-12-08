package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SizecaResponse {
    Integer idsizeca;
    String sizeca;
    Integer idloaica; // Trả về ID loại cá để tiện check nếu cần
    String tenloaica; // Trả thêm tên loại cá cho rõ ràng
}