package com.minhquan.QuanLyVuaCa.entity;


import jakarta.persistence.*;

@Entity
@Table(name = "SizeCa")
public class SizeCa {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private long idSizeCa;
  private long idLoaiCa;
  private String sizeCa;


  public long getIdSizeCa() {
    return idSizeCa;
  }

  public void setIdSizeCa(long idSizeCa) {
    this.idSizeCa = idSizeCa;
  }


  public long getIdLoaiCa() {
    return idLoaiCa;
  }

  public void setIdLoaiCa(long idLoaiCa) {
    this.idLoaiCa = idLoaiCa;
  }


  public String getSizeCa() {
    return sizeCa;
  }

  public void setSizeCa(String sizeCa) {
    this.sizeCa = sizeCa;
  }

}
