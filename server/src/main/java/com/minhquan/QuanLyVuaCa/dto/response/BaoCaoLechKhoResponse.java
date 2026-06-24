package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BaoCaoLechKhoResponse {
    Integer idchitietcaban;
    String tenLoaiCa;
    String tenSize;
    BigDecimal khoSoluongton;
    BigDecimal tongLoConLai;
    // dương = lô cao hơn kho (lô chưa được trừ đủ, ví dụ do COD bỏ qua lô trước khi fix)
    // âm = kho cao hơn lô (lô đã về thấp hơn thực tế kho còn, cần xem tay)
    BigDecimal lech;
    // false = chưa từng có phiếu nhập/lô nào cho sản phẩm này (soluongton chắc chắn đến từ
    // "số lượng tồn ban đầu" lúc tạo sản phẩm kho, không phải do lô bị lệch)
    boolean coLoLichSu;
}
