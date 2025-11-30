package com.minhquan.QuanLyVuaCa.dto.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Data
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaiKhoanCreationRequest {

    private Integer idvaitro;
    private String ho;
    private String ten;
    private String matkhau;
    private String email;
    private String sodienthoai;
    private String diachi;
}
