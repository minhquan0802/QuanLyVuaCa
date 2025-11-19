package com.minhquan.QuanLyVuaCa.entity;


import jakarta.persistence.*;

@Entity
@Table(name = "PhieuNhap")
public class PhieuNhap {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String idPhieuNhap;
  private long idNcc;
  private String idNguoiTaoPhieu;
  private java.sql.Date ngayNhap;
  private double tongSoLuong;
  private String trangThaiThanhToan;
  private String ghiChu;


  public String getIdPhieuNhap() {
    return idPhieuNhap;
  }

  public void setIdPhieuNhap(String idPhieuNhap) {
    this.idPhieuNhap = idPhieuNhap;
  }


  public long getIdNcc() {
    return idNcc;
  }

  public void setIdNcc(long idNcc) {
    this.idNcc = idNcc;
  }


  public String getIdNguoiTaoPhieu() {
    return idNguoiTaoPhieu;
  }

  public void setIdNguoiTaoPhieu(String idNguoiTaoPhieu) {
    this.idNguoiTaoPhieu = idNguoiTaoPhieu;
  }


  public java.sql.Date getNgayNhap() {
    return ngayNhap;
  }

  public void setNgayNhap(java.sql.Date ngayNhap) {
    this.ngayNhap = ngayNhap;
  }


  public double getTongSoLuong() {
    return tongSoLuong;
  }

  public void setTongSoLuong(double tongSoLuong) {
    this.tongSoLuong = tongSoLuong;
  }


  public String getTrangThaiThanhToan() {
    return trangThaiThanhToan;
  }

  public void setTrangThaiThanhToan(String trangThaiThanhToan) {
    this.trangThaiThanhToan = trangThaiThanhToan;
  }


  public String getGhiChu() {
    return ghiChu;
  }

  public void setGhiChu(String ghiChu) {
    this.ghiChu = ghiChu;
  }

}
