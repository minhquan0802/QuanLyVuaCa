package com.minhquan.QuanLyVuaCa.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoaicaCeationRequest {
    String tenloaica;
    String mieuta;
    // KHÔNG nhận hinhanhurl từ FE nữa
    // BE tự set sau
    String hinhanhurl;

    // Thêm dòng này
    MultipartFile hinhanh;
}
