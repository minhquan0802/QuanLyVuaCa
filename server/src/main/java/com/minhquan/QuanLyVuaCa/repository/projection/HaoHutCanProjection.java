package com.minhquan.QuanLyVuaCa.repository.projection;

import java.math.BigDecimal;

public interface HaoHutCanProjection {
    Integer getIdLoaiCa();
    String getTenLoaiCa();
    String getTenSize();
    BigDecimal getTongKgDuKien();
    BigDecimal getTongKgThucTe();
    Long getSoDongDon();
}
