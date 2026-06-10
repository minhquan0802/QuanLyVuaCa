package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "chitiet_gio_hang")
public class ChitietGioHang {
    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idchitietgiohang", nullable = false, length = 36)
    private String idchitietgiohang;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idgiohang", nullable = false)
    private GioHang idgiohang;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idchitietcaban", nullable = false)
    private Chitietcaban idchitietcaban;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "iddonvitinh", nullable = false)
    private Donvitinh iddonvitinh;

    @NotNull
    @Column(name = "soluong", nullable = false)
    private Integer soluong = 1;

    @Column(name = "ngaythem")
    private LocalDateTime ngaythem;
}
