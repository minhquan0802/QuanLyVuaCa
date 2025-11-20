package com.minhquan.QuanLyVuaCa.Tam;

import jakarta.persistence.*;

@Entity
@Table(name = "ChiTietCaBan")
public class ChiTietCaBan {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private long idChiTietCaBan;
  private long idLoaiCa;
  private long idSizeCa;
  private double soLuongTon;


  public long getIdChiTietCaBan() {
    return idChiTietCaBan;
  }

  public void setIdChiTietCaBan(long idChiTietCaBan) {
    this.idChiTietCaBan = idChiTietCaBan;
  }


  public long getIdLoaiCa() {
    return idLoaiCa;
  }

  public void setIdLoaiCa(long idLoaiCa) {
    this.idLoaiCa = idLoaiCa;
  }


  public long getIdSizeCa() {
    return idSizeCa;
  }

  public void setIdSizeCa(long idSizeCa) {
    this.idSizeCa = idSizeCa;
  }


  public double getSoLuongTon() {
    return soLuongTon;
  }

  public void setSoLuongTon(double soLuongTon) {
    this.soLuongTon = soLuongTon;
  }

}
