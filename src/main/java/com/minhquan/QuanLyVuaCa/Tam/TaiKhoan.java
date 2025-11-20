package com.minhquan.QuanLyVuaCa.Tam;


import jakarta.persistence.*;

@Entity
@Table(name = "TaiKhoan")
public class TaiKhoan {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String idTaiKhoan;
  private long idVaiTro;
  private String ho;
  private String ten;
  private String matKhau;
  private String email;
  private String soDienThoai;
  private String diaChi;
  private String trangThaiTk;


  public String getIdTaiKhoan() {
    return idTaiKhoan;
  }

  public void setIdTaiKhoan(String idTaiKhoan) {
    this.idTaiKhoan = idTaiKhoan;
  }


  public long getIdVaiTro() {
    return idVaiTro;
  }

  public void setIdVaiTro(long idVaiTro) {
    this.idVaiTro = idVaiTro;
  }


  public String getHo() {
    return ho;
  }

  public void setHo(String ho) {
    this.ho = ho;
  }


  public String getTen() {
    return ten;
  }

  public void setTen(String ten) {
    this.ten = ten;
  }


  public String getMatKhau() {
    return matKhau;
  }

  public void setMatKhau(String matKhau) {
    this.matKhau = matKhau;
  }


  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }


  public String getSoDienThoai() {
    return soDienThoai;
  }

  public void setSoDienThoai(String soDienThoai) {
    this.soDienThoai = soDienThoai;
  }


  public String getDiaChi() {
    return diaChi;
  }

  public void setDiaChi(String diaChi) {
    this.diaChi = diaChi;
  }


  public String getTrangThaiTk() {
    return trangThaiTk;
  }

  public void setTrangThaiTk(String trangThaiTk) {
    this.trangThaiTk = trangThaiTk;
  }

}
