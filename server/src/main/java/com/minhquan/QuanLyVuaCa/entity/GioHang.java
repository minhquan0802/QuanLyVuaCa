package com.minhquan.QuanLyVuaCa.entity;

import com.minhquan.QuanLyVuaCa.enums.TrangThaiGioHang;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "gio_hang")
public class GioHang {
    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idgiohang", nullable = false, length = 36)
    private String idgiohang;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idtaikhoan", nullable = false)
    private Taikhoan idtaikhoan;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangthai", columnDefinition = "VARCHAR(50) DEFAULT 'DANG_HOAT_DONG'")
    private TrangThaiGioHang trangthai = TrangThaiGioHang.DANG_HOAT_DONG;

    @Column(name = "ngaytao", updatable = false)
    private LocalDateTime ngaytao;

    @Column(name = "ngaycapnhat")
    private LocalDateTime ngaycapnhat;

    @PrePersist
    void onCreate() {
        ngaytao = LocalDateTime.now();
        ngaycapnhat = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        ngaycapnhat = LocalDateTime.now();
    }
}
