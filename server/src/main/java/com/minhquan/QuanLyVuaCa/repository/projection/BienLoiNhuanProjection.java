package com.minhquan.QuanLyVuaCa.repository.projection;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Dùng chung cho hai truy vấn biên lợi nhuận (theo sản phẩm và theo lô). Các trường chỉ có ý nghĩa
 * ở một trong hai truy vấn sẽ trả null ở truy vấn còn lại.
 */
public interface BienLoiNhuanProjection {
    Integer getIdLoaiCa();
    String getTenLoaiCa();
    String getTenSize();
    String getIdPhieuNhap();
    String getIdLo();
    LocalDate getNgayNhap();
    BigDecimal getSoLuongBan();
    BigDecimal getGiaVon();
    BigDecimal getDoanhThu();
}
