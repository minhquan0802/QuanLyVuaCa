package com.minhquan.QuanLyVuaCa.Tam;


import jakarta.persistence.*;

@Entity
@Table(name = "DonHang")
public class DonHang {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String idDonHang;
  private String idThongTinKhachHang;
  private java.sql.Timestamp ngayDat;
  private String trangThaiDonHang;


  public String getIdDonHang() {
    return idDonHang;
  }

  public void setIdDonHang(String idDonHang) {
    this.idDonHang = idDonHang;
  }


  public String getIdThongTinKhachHang() {
    return idThongTinKhachHang;
  }

  public void setIdThongTinKhachHang(String idThongTinKhachHang) {
    this.idThongTinKhachHang = idThongTinKhachHang;
  }


  public java.sql.Timestamp getNgayDat() {
    return ngayDat;
  }

  public void setNgayDat(java.sql.Timestamp ngayDat) {
    this.ngayDat = ngayDat;
  }


  public String getTrangThaiDonHang() {
    return trangThaiDonHang;
  }

  public void setTrangThaiDonHang(String trangThaiDonHang) {
    this.trangThaiDonHang = trangThaiDonHang;
  }

}
