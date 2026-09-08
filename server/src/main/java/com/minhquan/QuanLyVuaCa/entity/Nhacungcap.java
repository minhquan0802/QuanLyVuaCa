package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "nhacungcap")
public class Nhacungcap {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idncc", nullable = false)
    private Integer id;

    @Size(max = 60)
    @Column(name = "tenncc", length = 60)
    private String tenncc;

    @Size(max = 15)
    @Column(name = "sodienthoai", length = 15)
    private String sodienthoai;

    @Size(max = 150)
    @Column(name = "diachi", length = 150)
    private String diachi;

    @Size(max = 100)
    @Column(name = "email", length = 100)
    private String email;

    @Size(max = 20)
    @Column(name = "masothue", length = 20)
    private String masothue;

    @Size(max = 60)
    @Column(name = "nguoilienhe", length = 60)
    private String nguoilienhe;

    // Số ngày được nợ mặc định kể từ ngày nhập — dùng để tính hạn trả cho phiếu nhập mới.
    @Column(name = "hantramacdinh")
    private Integer hantramacdinh;

    // Số dư nợ hiện tại vựa đang nợ NCC này. Là ảnh chụp của sổ cái lichsucongnoncc,
    // giữ ở đây để tra cứu nhanh (giống Taikhoan.congnohientai bên phía khách hàng).
    @Column(name = "congnophaitra", precision = 18, scale = 2)
    private BigDecimal congnophaitra = BigDecimal.ZERO;

}