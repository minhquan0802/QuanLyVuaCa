package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoaicaUpdateRequest {
    @NotBlank(message = "LOAICA_NAME_INVALID")
    @Size(max = 60, message = "LOAICA_NAME_INVALID")
    String tenloaica;

    @Size(max = 2000, message = "LOAICA_DESCRIPTION_INVALID")
    String mieuta;

    MultipartFile hinhanh;
}
