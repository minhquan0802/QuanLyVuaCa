package com.minhquan.QuanLyVuaCa.entity;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiCa;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "chitietphieunhap")
public class Chitietphieunhap {
    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idchitietphieunhap", nullable = false, length = 36)
    private String idchitietphieunhap;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idphieunhap")
    private Phieunhap idphieunhap;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idchitietcaban")
    private Chitietcaban idchitietcaban;

    @Column(name = "soluongnhap", precision = 12, scale = 2)
    private BigDecimal soluongnhap;

    @Column(name = "soluongton", precision = 12, scale = 2)
    private BigDecimal soluongton;

    @Column(name = "gianhap", precision = 10, scale = 2)
    private BigDecimal gianhap;

    @Column(name = "giabantaithoidiemnhap", precision = 10, scale = 2)
    private BigDecimal giabantaithoidiemnhap;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangthaica", columnDefinition = "ENUM('CON_HANG', 'HET_HANG', 'THANH_LY')")
    private TrangThaiCa trangthaica;

    @Column(name = "ngaythanhly")
    private LocalDate ngaythanhly;

}