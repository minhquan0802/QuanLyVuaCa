package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChiTietLichDatHangResponse {
    String idchitietlich;
    Integer idchitietcaban;
    String tenLoaiCa;
    String tenSize;
    String hinhAnhUrl;
    Integer iddonvitinh;
    String tenDonViTinh;
    Integer soluong;
    // Sản phẩm đã bị ngừng kinh doanh -> lịch vẫn giữ dòng này nhưng sinh đơn sẽ bỏ qua nó.
    boolean ngungKinhDoanh;
}
