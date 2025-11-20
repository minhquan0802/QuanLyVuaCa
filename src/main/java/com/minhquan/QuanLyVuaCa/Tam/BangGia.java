package com.minhquan.QuanLyVuaCa.Tam;


import jakarta.persistence.*;

@Entity
@Table(name = "BangGia")
public class BangGia {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  // Sửa long -> Integer
  private Integer idBangGia;
  private long idChiTietCaBan;
  private long idLoaiKhachHang;
  private double giaBanLe;
  private double giaSi1;
  private double giaSi2;
  private java.sql.Date ngayBatDau;
  private java.sql.Date ngayKetThuc;


  public long getIdBangGia() {
    return idBangGia;
  }

  public void setIdBangGia(Integer idBangGia) {
    this.idBangGia = idBangGia;
  }


  public long getIdChiTietCaBan() {
    return idChiTietCaBan;
  }

  public void setIdChiTietCaBan(long idChiTietCaBan) {
    this.idChiTietCaBan = idChiTietCaBan;
  }


  public long getIdLoaiKhachHang() {
    return idLoaiKhachHang;
  }

  public void setIdLoaiKhachHang(long idLoaiKhachHang) {
    this.idLoaiKhachHang = idLoaiKhachHang;
  }


  public double getGiaBanLe() {
    return giaBanLe;
  }

  public void setGiaBanLe(double giaBanLe) {
    this.giaBanLe = giaBanLe;
  }


  public double getGiaSi1() {
    return giaSi1;
  }

  public void setGiaSi1(double giaSi1) {
    this.giaSi1 = giaSi1;
  }


  public double getGiaSi2() {
    return giaSi2;
  }

  public void setGiaSi2(double giaSi2) {
    this.giaSi2 = giaSi2;
  }


  public java.sql.Date getNgayBatDau() {
    return ngayBatDau;
  }

  public void setNgayBatDau(java.sql.Date ngayBatDau) {
    this.ngayBatDau = ngayBatDau;
  }


  public java.sql.Date getNgayKetThuc() {
    return ngayKetThuc;
  }

  public void setNgayKetThuc(java.sql.Date ngayKetThuc) {
    this.ngayKetThuc = ngayKetThuc;
  }

}
