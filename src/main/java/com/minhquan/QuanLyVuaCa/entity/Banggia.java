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
    // QUAN TRỌNG: Phải có dòng này để tương thích với AUTO_INCREMENT của MySQL
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idbanggia", nullable = false)
    private Integer id;

    // SỬA LẠI TÊN BIẾN: Đặt là 'chitietcaban' thay vì 'idchitietcaban'
    // Vì đây là một Object, không phải số Int
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idchitietcaban", nullable = false) // Tên cột trong DB giữ nguyên
    private Chitietcaban chitietcaban;

    @Column(name = "idloaikhachhang")
    private Integer idloaikhachhang;

    @Column(name = "giabanle", precision = 18, scale = 2)
    private BigDecimal giabanle;

    @Column(name = "giabansi", precision = 18, scale = 2)
    private BigDecimal giabansi;

    @Column(name = "ngaybatdau")
    private LocalDate ngaybatdau;

    @Column(name = "ngayketthuc")
    private LocalDate ngayketthuc;
}