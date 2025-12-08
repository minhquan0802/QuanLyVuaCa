package com.minhquan.QuanLyVuaCa.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SizecaRequest {
    Integer idloaica; // ID của loại cá
    String sizeca;    // Tên size (VD: "1kg - 2kg")
}