package com.minhquan.QuanLyVuaCa.Tam;


import jakarta.persistence.*;

@Entity
@Table(name = "QuyDoi")
public class QuyDoi {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private long idQuyDoi;
  private long idChiTietCaBan;
  private double soKoTungDung;


  public long getIdQuyDoi() {
    return idQuyDoi;
  }

  public void setIdQuyDoi(long idQuyDoi) {
    this.idQuyDoi = idQuyDoi;
  }


  public long getIdChiTietCaBan() {
    return idChiTietCaBan;
  }

  public void setIdChiTietCaBan(long idChiTietCaBan) {
    this.idChiTietCaBan = idChiTietCaBan;
  }


  public double getSoKoTungDung() {
    return soKoTungDung;
  }

  public void setSoKoTungDung(double soKoTungDung) {
    this.soKoTungDung = soKoTungDung;
  }

}
