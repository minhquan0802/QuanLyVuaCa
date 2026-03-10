package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SizecaResponse {
    private Integer idsizeca;
    private String sizeca;
}