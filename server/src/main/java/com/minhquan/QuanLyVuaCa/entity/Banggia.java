package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idbanggia", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idchitietcaban", nullable = false)
    private Chitietcaban chitietcaban;

    @Column(name = "giabanle", precision = 18, scale = 2)
    private BigDecimal giabanle;

    @Column(name = "giabansi", precision = 18, scale = 2)
    private BigDecimal giabansi;

    @Column(name = "ngaybatdau")
    private LocalDate ngaybatdau;

    @Column(name = "ngayketthuc")
    private LocalDate ngayketthuc;
}