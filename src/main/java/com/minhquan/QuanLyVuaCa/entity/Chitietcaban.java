package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "chitietcaban")
public class Chitietcaban {
    @Id
    @Column(name = "idchitietcaban", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idloaica", nullable = false)
    private Loaica idloaica;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idsizeca", nullable = false)
    private Sizeca idsizeca;

    @Column(name = "soluongton", precision = 10, scale = 2)
    private BigDecimal soluongton;

}