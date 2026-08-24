package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

/**
 * Một dòng báo cáo hao hụt cân: chênh lệch giữa khối lượng ước lượng theo định mức và khối lượng
 * cân thật lúc đóng hàng, gộp theo loại cá × size.
 *
 * Lưu ý: đây KHÔNG phải "hao hụt" trong bảng luân chuyển hàng hóa của Dashboard — chỉ tiêu đó là
 * thanh lý + tiêu hủy (hàng hỏng). Hai con số đo hai thứ khác nhau.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HaoHutCanResponse {
    Integer idLoaiCa;
    String tenLoaiCa;
    String tenSize;
    BigDecimal tongKgDuKien;
    BigDecimal tongKgThucTe;
    BigDecimal chenhLech;
    // (thực tế - dự kiến) / dự kiến, đơn vị %.
    BigDecimal tyLeLech;
    long soDongDon;
    boolean vuotNguong;
}
