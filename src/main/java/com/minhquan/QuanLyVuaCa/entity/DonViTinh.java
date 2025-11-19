package com.minhquan.QuanLyVuaCa.entity;


import jakarta.persistence.*;

@Entity
@Table(name = "DonViTinh")
public class DonViTinh {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private long idDvt;
  private String tenDvt;
  private double heSoKg;
  private String ghiChu;


  public long getIdDvt() {
    return idDvt;
  }

  public void setIdDvt(long idDvt) {
    this.idDvt = idDvt;
  }


  public String getTenDvt() {
    return tenDvt;
  }

  public void setTenDvt(String tenDvt) {
    this.tenDvt = tenDvt;
  }


  public double getHeSoKg() {
    return heSoKg;
  }

  public void setHeSoKg(double heSoKg) {
    this.heSoKg = heSoKg;
  }


  public String getGhiChu() {
    return ghiChu;
  }

  public void setGhiChu(String ghiChu) {
    this.ghiChu = ghiChu;
  }

}
