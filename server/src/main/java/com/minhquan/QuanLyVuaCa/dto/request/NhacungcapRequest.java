package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NhacungcapRequest {

    @NotBlank(message = "NHACUNGCAP_NAME_INVALID")
    @Size(max = 60, message = "NHACUNGCAP_NAME_INVALID")
    private String tenncc;

    @NotBlank(message = "NHACUNGCAP_PHONE_INVALID")
    @Size(max = 15, message = "NHACUNGCAP_PHONE_INVALID")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "NHACUNGCAP_PHONE_INVALID")
    private String sodienthoai;

    @Size(max = 150, message = "NHACUNGCAP_DIACHI_INVALID")
    private String diachi;

    @Email(message = "NHACUNGCAP_EMAIL_INVALID")
    @Size(max = 100, message = "NHACUNGCAP_EMAIL_INVALID")
    private String email;

    @Size(max = 20, message = "NHACUNGCAP_MASOTHUE_INVALID")
    private String masothue;

    @Size(max = 60, message = "NHACUNGCAP_NGUOILIENHE_INVALID")
    private String nguoilienhe;

    // Số ngày được nợ mặc định; để trống nghĩa là phải trả ngay khi nhập.
    @Min(value = 0, message = "NHACUNGCAP_HANTRA_INVALID")
    private Integer hantramacdinh;
}
