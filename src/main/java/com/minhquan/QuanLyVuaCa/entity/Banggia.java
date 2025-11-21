package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "banggia")
public class Banggia {
    @Id
    @Column(name = "idbanggia", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idchitietcaban", nullable = false)
    private Chitietcaban idchitietcaban;

    @Column(name = "idloaikhachhang")
    private Integer idloaikhachhang;

    @Column(name = "giabanle", precision = 18, scale = 2)
    private BigDecimal giabanle;

    @Column(name = "giasi1", precision = 18, scale = 2)
    private BigDecimal giasi1;

    @Column(name = "ngaybatdau")
    private LocalDate ngaybatdau;

    @Column(name = "ngayketthuc")
    private LocalDate ngayketthuc;

}