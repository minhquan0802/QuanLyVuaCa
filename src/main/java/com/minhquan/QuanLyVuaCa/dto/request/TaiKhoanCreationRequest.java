package com.minhquan.QuanLyVuaCa.dto.request;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiTaiKhoan;
import com.minhquan.QuanLyVuaCa.entity.Vaitro;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TaiKhoanCreationRequest {

    private Integer idvaitro;
    private String ho;
    private String ten;
    private char matkhau;
    private String email;
    private String sodienthoai;
    private String diachi;
    private TrangThaiTaiKhoan trangthaitk;
}
