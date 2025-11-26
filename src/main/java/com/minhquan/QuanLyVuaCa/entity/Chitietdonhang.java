package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "chitietdonhang")
public class Chitietdonhang {
    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idchitietdonhang", nullable = false, length = 36)
    private String idchitietdonhang;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "iddonhang", nullable = false)
    private Donhang iddonhang;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idchitietcaban", nullable = false)
    private Chitietcaban idchitietcaban;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "iddonvitinh", nullable = false)
    private Donvitinh iddonvitinh;

    @Column(name = "soluong")
    private Integer soluong;

    @Column(name = "soluongkgthucte", precision = 12, scale = 2)
    private BigDecimal soluongkgthucte;

    @Column(name = "soluongkgthuctequydoi", precision = 12, scale = 2)
    private BigDecimal soluongkgthuctequydoi;

    @Column(name = "tongtiendukien", precision = 12, scale = 2)
    private BigDecimal tongtiendukien;

    @Column(name = "tongtienthucte", precision = 12, scale = 2)
    private BigDecimal tongtienthucte;

}