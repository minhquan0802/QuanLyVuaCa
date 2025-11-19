package com.minhquan.QuanLyVuaCa.entity;


import jakarta.persistence.*;

@Entity
@Table(name = "NhaCungCap")
public class NhaCungCap {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private long idNcc;
  private String tenNcc;
  private String soDienThoai;


  public long getIdNcc() {
    return idNcc;
  }

  public void setIdNcc(long idNcc) {
    this.idNcc = idNcc;
  }


  public String getTenNcc() {
    return tenNcc;
  }

  public void setTenNcc(String tenNcc) {
    this.tenNcc = tenNcc;
  }


  public String getSoDienThoai() {
    return soDienThoai;
  }

  public void setSoDienThoai(String soDienThoai) {
    this.soDienThoai = soDienThoai;
  }

}
