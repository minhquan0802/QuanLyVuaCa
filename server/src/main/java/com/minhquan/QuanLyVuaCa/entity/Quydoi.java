package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "quydoi")
public class Quydoi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idquydoi", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idchitietcaban", nullable = false)
    private Chitietcaban idchitietcaban;

    @Column(name = "sokgtuongung", precision = 10, scale = 2)
    private BigDecimal sokgtuongung;

}