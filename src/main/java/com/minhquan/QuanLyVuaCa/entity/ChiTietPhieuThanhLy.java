package com.minhquan.QuanLyVuaCa.entity;


import jakarta.persistence.*;

@Entity
@Table(name = "ChiTietPhieuThanhLy")
public class ChiTietPhieuThanhLy {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String idChiTietPhieuThanhLy;
  private String idPhieuThanhLy;
  private long idChiTietCaBan;
  private double soLuongThanhLy;
  private double donGia;
  private double thanhTien;


  public String getIdChiTietPhieuThanhLy() {
    return idChiTietPhieuThanhLy;
  }

  public void setIdChiTietPhieuThanhLy(String idChiTietPhieuThanhLy) {
    this.idChiTietPhieuThanhLy = idChiTietPhieuThanhLy;
  }


  public String getIdPhieuThanhLy() {
    return idPhieuThanhLy;
  }

  public void setIdPhieuThanhLy(String idPhieuThanhLy) {
    this.idPhieuThanhLy = idPhieuThanhLy;
  }


  public long getIdChiTietCaBan() {
    return idChiTietCaBan;
  }

  public void setIdChiTietCaBan(long idChiTietCaBan) {
    this.idChiTietCaBan = idChiTietCaBan;
  }


  public double getSoLuongThanhLy() {
    return soLuongThanhLy;
  }

  public void setSoLuongThanhLy(double soLuongThanhLy) {
    this.soLuongThanhLy = soLuongThanhLy;
  }


  public double getDonGia() {
    return donGia;
  }

  public void setDonGia(double donGia) {
    this.donGia = donGia;
  }


  public double getThanhTien() {
    return thanhTien;
  }

  public void setThanhTien(double thanhTien) {
    this.thanhTien = thanhTien;
  }

}
