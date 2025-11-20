package com.minhquan.QuanLyVuaCa.Tam;


import jakarta.persistence.*;

@Entity
@Table(name = "ChiTietPhieuNhap")
public class ChiTietPhieuNhap {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String idChiTietPhieuNhap;
  private String idPhieuNhap;
  private long idChiTietCaBan;
  private long idBangGia;
  private double soLuongNhap;
  private double soLuongTon;
  private double giaNhap;
  private double giaBanTaiThoiDiemNhap;
  private String trangThaiCa;
  private java.sql.Date ngayThanhLy;


  public String getIdChiTietPhieuNhap() {
    return idChiTietPhieuNhap;
  }

  public void setIdChiTietPhieuNhap(String idChiTietPhieuNhap) {
    this.idChiTietPhieuNhap = idChiTietPhieuNhap;
  }


  public String getIdPhieuNhap() {
    return idPhieuNhap;
  }

  public void setIdPhieuNhap(String idPhieuNhap) {
    this.idPhieuNhap = idPhieuNhap;
  }


  public long getIdChiTietCaBan() {
    return idChiTietCaBan;
  }

  public void setIdChiTietCaBan(long idChiTietCaBan) {
    this.idChiTietCaBan = idChiTietCaBan;
  }


  public long getIdBangGia() {
    return idBangGia;
  }

  public void setIdBangGia(long idBangGia) {
    this.idBangGia = idBangGia;
  }


  public double getSoLuongNhap() {
    return soLuongNhap;
  }

  public void setSoLuongNhap(double soLuongNhap) {
    this.soLuongNhap = soLuongNhap;
  }


  public double getSoLuongTon() {
    return soLuongTon;
  }

  public void setSoLuongTon(double soLuongTon) {
    this.soLuongTon = soLuongTon;
  }


  public double getGiaNhap() {
    return giaNhap;
  }

  public void setGiaNhap(double giaNhap) {
    this.giaNhap = giaNhap;
  }


  public double getGiaBanTaiThoiDiemNhap() {
    return giaBanTaiThoiDiemNhap;
  }

  public void setGiaBanTaiThoiDiemNhap(double giaBanTaiThoiDiemNhap) {
    this.giaBanTaiThoiDiemNhap = giaBanTaiThoiDiemNhap;
  }


  public String getTrangThaiCa() {
    return trangThaiCa;
  }

  public void setTrangThaiCa(String trangThaiCa) {
    this.trangThaiCa = trangThaiCa;
  }


  public java.sql.Date getNgayThanhLy() {
    return ngayThanhLy;
  }

  public void setNgayThanhLy(java.sql.Date ngayThanhLy) {
    this.ngayThanhLy = ngayThanhLy;
  }

}
