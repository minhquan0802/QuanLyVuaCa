package com.minhquan.QuanLyVuaCa.dto.request;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiTaiKhoan;
import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Data
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaiKhoanUpdateRequest {
    Integer idvaitro;
    String ho;
    String ten;
    String matkhau;
    String email;
    String sodienthoai;
    String diachi;
    TrangThaiTaiKhoan trangthaitk;
}
