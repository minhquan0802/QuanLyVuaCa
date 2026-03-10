package com.minhquan.QuanLyVuaCa.entity;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiThanhToan;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "phieunhap")
public class Phieunhap {
    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idphieunhap", nullable = false, length = 36)
    private String idphieunhap;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idncc")
    private Nhacungcap idncc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idnguoitaophieu")
    private Taikhoan idnguoitaophieu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idloaica")
    private Loaica idloaica;

    @Column(name = "ngaynhap")
    private LocalDate ngaynhap;

    @Column(name = "tongsoluong", precision = 12, scale = 2)
    private BigDecimal tongsoluong;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangthaithanhtoan", columnDefinition = "ENUM('CHUA_THANH_TOAN','DA_THANH_TOAN')")
    private TrangThaiThanhToan trangthaithanhtoan;

    @Size(max = 100)
    @Column(name = "ghichu", length = 100)
    private String ghichu;

}