package com.minhquan.QuanLyVuaCa.dto.request;

public class TaiKhoanCreationRequest {
    private long idVaiTro;
    private String ho;
    private String ten;
    private String matKhau;
    private String email;
    private String soDienThoai;
    private String diaChi;
    private String trangThaiTk;

    public String getDiaChi() {
        return diaChi;
    }

    public void setDiaChi(String diaChi) {
        this.diaChi = diaChi;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getHo() {
        return ho;
    }

    public void setHo(String ho) {
        this.ho = ho;
    }

    public long getIdVaiTro() {
        return idVaiTro;
    }

    public void setIdVaiTro(long idVaiTro) {
        this.idVaiTro = idVaiTro;
    }

    public String getMatKhau() {
        return matKhau;
    }

    public void setMatKhau(String matKhau) {
        this.matKhau = matKhau;
    }

    public String getSoDienThoai() {
        return soDienThoai;
    }

    public void setSoDienThoai(String soDienThoai) {
        this.soDienThoai = soDienThoai;
    }

    public String getTen() {
        return ten;
    }

    public void setTen(String ten) {
        this.ten = ten;
    }

    public String getTrangThaiTk() {
        return trangThaiTk;
    }

    public void setTrangThaiTk(String trangThaiTk) {
        this.trangThaiTk = trangThaiTk;
    }
}
