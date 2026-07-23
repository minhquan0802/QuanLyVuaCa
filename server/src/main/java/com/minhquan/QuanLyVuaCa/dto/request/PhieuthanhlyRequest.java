package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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
    @NotBlank(message = "INVALID_KEY")
    String lydothanhly;

    String ghichu;

    // "DA_TIEU_HUY" hoac "DA_BAN_THANH_LY"
    @NotBlank(message = "TRANGTHAI_THANHLY_INVALID")
    String trangthai;

    @NotEmpty(message = "CHITIET_THANHLY_EMPTY")
    @Valid
    List<ChitietPhieuthanhlyRequest> listChiTiet;
}
