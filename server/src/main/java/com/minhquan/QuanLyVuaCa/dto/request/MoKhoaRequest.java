package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MoKhoaRequest {
    @NotBlank(message = "Vui lòng nhập lý do mở khóa")
    String ghichu;
}
