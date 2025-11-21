package com.minhquan.QuanLyVuaCa.dto.request;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiTaiKhoan;
import lombok.Data;

@Data
public class TaiKhoanCreationRequest {

    private Integer idvaitro;
    private String ho;
    private String ten;
    private String matkhau;
    private String email;
    private String sodienthoai;
    private String diachi;
    private TrangThaiTaiKhoan trangthaitk;
}
