package com.minhquan.QuanLyVuaCa.entity;

import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToan;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "thanhtoan")
public class Thanhtoan {

    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idthanhtoan", nullable = false, length = 36)
    private String idthanhtoan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "iddonhang", nullable = false)
    private Donhang iddonhang;

    @Column(name = "sotien", precision = 12, scale = 2, nullable = false)
    private BigDecimal sotien;

    @Column(name = "phuongthuc", length = 50, nullable = false)
    private String phuongthuc;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangthai", columnDefinition = "ENUM('CHUA_THANH_TOAN','CHO_XAC_NHAN','DA_THANH_TOAN') DEFAULT 'CHO_XAC_NHAN'")
    private TrangThaiThanhToan trangthai;

    @Column(name = "ngaythanhtoan")
    private LocalDateTime ngaythanhtoan;

    @Column(name = "ghichu", length = 255)
    private String ghichu;
}
