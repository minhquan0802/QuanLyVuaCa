package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ThongbaoRequest {
    @NotNull(message = "Vui lòng nhập nội dung thông báo")
    String noidung;

    // "ADMIN", "STAFF", ...
    @NotNull(message = "Vui lòng chọn vai trò nhận thông báo")
    String vaitro;

    String loai;

    String link;
}
