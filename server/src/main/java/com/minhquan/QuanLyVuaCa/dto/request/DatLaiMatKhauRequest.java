package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DatLaiMatKhauRequest {

    @NotBlank
    String token;

    @NotBlank
    @Size(min = 8, max = 50, message = "PASSWORD_INVALID")
    String matkhauMoi;
}
