package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ThemVaoGioHangRequest {

    @NotNull(message = "Thiếu sản phẩm")
    Integer idchitietcaban;

    @NotNull(message = "Thiếu đơn vị tính")
    Integer iddonvitinh;

    @NotNull
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    Integer soluong;
}
