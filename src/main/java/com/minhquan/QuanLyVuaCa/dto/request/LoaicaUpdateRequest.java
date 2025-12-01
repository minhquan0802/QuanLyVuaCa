package com.minhquan.QuanLyVuaCa.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoaicaUpdateRequest {
    String tenloaica;
    String mieuta;
    String hinhanhurl;
    MultipartFile hinhanh;
}
