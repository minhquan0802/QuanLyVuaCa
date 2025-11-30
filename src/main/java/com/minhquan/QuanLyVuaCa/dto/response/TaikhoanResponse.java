package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Data
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaikhoanResponse {
    String idtaikhoan;
    Integer idvaitro;
    String ho;
    String ten;
    String matkhau;
    String email;
    String sodienthoai;
    String diachi;
}
