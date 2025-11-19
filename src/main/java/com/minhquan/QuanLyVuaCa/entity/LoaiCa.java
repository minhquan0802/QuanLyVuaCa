package com.minhquan.QuanLyVuaCa.entity;


import jakarta.persistence.*;

@Entity
@Table(name = "LoaiCa")
public class LoaiCa {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private long idLoaiCa;
  private String tenLoaiCa;


  public long getIdLoaiCa() {
    return idLoaiCa;
  }

  public void setIdLoaiCa(long idLoaiCa) {
    this.idLoaiCa = idLoaiCa;
  }


  public String getTenLoaiCa() {
    return tenLoaiCa;
  }

  public void setTenLoaiCa(String tenLoaiCa) {
    this.tenLoaiCa = tenLoaiCa;
  }

}
