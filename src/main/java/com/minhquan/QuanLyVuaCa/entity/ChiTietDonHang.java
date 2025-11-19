package com.minhquan.QuanLyVuaCa.entity;


import jakarta.persistence.*;

@Entity
@Table(name = "ChiTietDonHang")
public class ChiTietDonHang {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String idChiTietDonHang;
  private String idDonHang;
  private long idChiTietCaBan;
  private long idDonViTinh;
  private long soLuong;
  private double soLuongKsThucTe;
  private double soLuongThucTe;
  private double tongTienUocTinh;
  private double tongTienThucTe;
  private String trangThaiDonHang;


  public String getIdChiTietDonHang() {
    return idChiTietDonHang;
  }

  public void setIdChiTietDonHang(String idChiTietDonHang) {
    this.idChiTietDonHang = idChiTietDonHang;
  }


  public String getIdDonHang() {
    return idDonHang;
  }

  public void setIdDonHang(String idDonHang) {
    this.idDonHang = idDonHang;
  }


  public long getIdChiTietCaBan() {
    return idChiTietCaBan;
  }

  public void setIdChiTietCaBan(long idChiTietCaBan) {
    this.idChiTietCaBan = idChiTietCaBan;
  }


  public long getIdDonViTinh() {
    return idDonViTinh;
  }

  public void setIdDonViTinh(long idDonViTinh) {
    this.idDonViTinh = idDonViTinh;
  }


  public long getSoLuong() {
    return soLuong;
  }

  public void setSoLuong(long soLuong) {
    this.soLuong = soLuong;
  }


  public double getSoLuongKsThucTe() {
    return soLuongKsThucTe;
  }

  public void setSoLuongKsThucTe(double soLuongKsThucTe) {
    this.soLuongKsThucTe = soLuongKsThucTe;
  }


  public double getSoLuongThucTe() {
    return soLuongThucTe;
  }

  public void setSoLuongThucTe(double soLuongThucTe) {
    this.soLuongThucTe = soLuongThucTe;
  }


  public double getTongTienUocTinh() {
    return tongTienUocTinh;
  }

  public void setTongTienUocTinh(double tongTienUocTinh) {
    this.tongTienUocTinh = tongTienUocTinh;
  }


  public double getTongTienThucTe() {
    return tongTienThucTe;
  }

  public void setTongTienThucTe(double tongTienThucTe) {
    this.tongTienThucTe = tongTienThucTe;
  }


  public String getTrangThaiDonHang() {
    return trangThaiDonHang;
  }

  public void setTrangThaiDonHang(String trangThaiDonHang) {
    this.trangThaiDonHang = trangThaiDonHang;
  }

}
