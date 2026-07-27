package com.minhquan.QuanLyVuaCa.dto.request;

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


    //nha cung cap
}
