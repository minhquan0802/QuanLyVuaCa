package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ThongbaoResponse {
    String idthongbao;
    String noidung;
    String loai;
    String link;
    Boolean daxem;
    Instant thoigiantao;
}
