package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ThanhToanNccRequest {

    @NotNull(message = "Vui lòng nhập số tiền thanh toán")
    BigDecimal sotien;

    // Để trống khi trả gộp nhiều chuyến hàng cùng lúc.
    String idphieunhap;

    String hinhthuc;

    String ghichu;
}
