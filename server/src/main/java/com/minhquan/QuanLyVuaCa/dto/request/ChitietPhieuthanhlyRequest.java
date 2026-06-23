package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;

@Slf4j
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChitietPhieuthanhlyRequest {
    @NotNull(message = "Vui lòng chọn lô hàng cần thanh lý")
    String idchitietphieunhap;

    @NotNull(message = "Số lượng thanh lý không được để trống")
    @Min(value = 0, message = "Số lượng thanh lý phải lớn hơn 0")
    BigDecimal soluongthanhly;

    @NotNull(message = "Đơn giá thanh lý không được để trống")
    @Min(value = 0, message = "Đơn giá thanh lý không được âm")
    BigDecimal dongia;
}
