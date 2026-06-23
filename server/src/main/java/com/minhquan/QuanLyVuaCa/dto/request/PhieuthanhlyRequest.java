package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PhieuthanhlyRequest {
    @NotNull(message = "Vui lòng nhập lý do thanh lý")
    String lydothanhly;

    String ghichu;

    // "DA_TIEU_HUY" hoac "DA_BAN_THANH_LY"
    String trangthai;

    @NotNull(message = "Danh sách chi tiết không được trống")
    List<ChitietPhieuthanhlyRequest> listChiTiet;
}
