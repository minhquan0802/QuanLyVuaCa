package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
public class ChiTietLichDatHangRequest {

    @NotNull(message = "LICH_DINH_KY_THIEU_SAN_PHAM")
    Integer idchitietcaban;

    @NotNull(message = "LICH_DINH_KY_THIEU_DON_VI_TINH")
    Integer iddonvitinh;

    @NotNull(message = "LICH_DINH_KY_SO_LUONG_INVALID")
    @Min(value = 1, message = "LICH_DINH_KY_SO_LUONG_INVALID")
    Integer soluong;
}
