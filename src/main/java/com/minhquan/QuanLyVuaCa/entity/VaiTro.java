package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "VaiTro")
public class VaiTro {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private long idVaiTro;
  private String tenVaiTro;


  public long getIdVaiTro() {
    return idVaiTro;
  }

  public void setIdVaiTro(long idVaiTro) {
    this.idVaiTro = idVaiTro;
  }


  public String getTenVaiTro() {
    return tenVaiTro;
  }

  public void setTenVaiTro(String tenVaiTro) {
    this.tenVaiTro = tenVaiTro;
  }

}
