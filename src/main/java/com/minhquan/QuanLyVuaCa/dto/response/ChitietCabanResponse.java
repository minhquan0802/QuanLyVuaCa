package com.minhquan.QuanLyVuaCa.dto.response;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiTaiKhoan;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;

@Slf4j
@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChitietCabanResponse {
    Integer id;
    Integer idLoaiCa;
    Integer idSizeCa;       // FE: lấy value cho dropdown size
    String tenLoaiCa;
    String tenSize;
    BigDecimal soluongton;
}