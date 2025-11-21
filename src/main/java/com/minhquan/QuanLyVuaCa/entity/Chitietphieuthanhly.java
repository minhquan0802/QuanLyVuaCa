package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "chitietphieuthanhly")
public class Chitietphieuthanhly {
    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idchitietphieuthanhly", nullable = false, length = 36)
    private String idchitietphieuthanhly;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idphieuthanhly")
    private Phieuthanhly idphieuthanhly;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idchitietcaban")
    private Chitietcaban idchitietcaban;

    @Column(name = "soluongthanhly", precision = 12, scale = 2)
    private BigDecimal soluongthanhly;

    @Column(name = "dongia", precision = 10, scale = 2)
    private BigDecimal dongia;

    @Column(name = "thanhtien", precision = 12, scale = 2)
    private BigDecimal thanhtien;

}