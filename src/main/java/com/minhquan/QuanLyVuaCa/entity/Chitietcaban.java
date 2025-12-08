package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "chitietcaban")
public class Chitietcaban {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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