package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "PhieuThanhLy")
public class PhieuThanhLy {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String idPhieuThanhLy;
  private String idNguoiTaoPhieu;
  private java.sql.Date ngayThanhLy;
  private String lyDoThanhLy;
  private String ghiChu;


  public String getIdPhieuThanhLy() {
    return idPhieuThanhLy;
  }

  public void setIdPhieuThanhLy(String idPhieuThanhLy) {
    this.idPhieuThanhLy = idPhieuThanhLy;
  }


  public String getIdNguoiTaoPhieu() {
    return idNguoiTaoPhieu;
  }

  public void setIdNguoiTaoPhieu(String idNguoiTaoPhieu) {
    this.idNguoiTaoPhieu = idNguoiTaoPhieu;
  }


  public java.sql.Date getNgayThanhLy() {
    return ngayThanhLy;
  }

  public void setNgayThanhLy(java.sql.Date ngayThanhLy) {
    this.ngayThanhLy = ngayThanhLy;
  }


  public String getLyDoThanhLy() {
    return lyDoThanhLy;
  }

  public void setLyDoThanhLy(String lyDoThanhLy) {
    this.lyDoThanhLy = lyDoThanhLy;
  }


  public String getGhiChu() {
    return ghiChu;
  }

  public void setGhiChu(String ghiChu) {
    this.ghiChu = ghiChu;
  }

}
