package com.minhquan.QuanLyVuaCa.entity;

import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToanDonHang;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "donhang")
public class Donhang {
    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "iddonhang", nullable = false, length = 36)
    private String iddonhang;

    @Size(max = 36)
    @Column(name = "idthongtinkhachhang", length = 36)
    private String idthongtinkhachhang;

    @Column(name = "ngaydat")
    private LocalDateTime ngaydat;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangthaidonhang", columnDefinition = "ENUM('CHO_XAC_NHAN','DANG_DONG_HANG','DANG_VAN_CHUYEN','GIAO_HANG_THANH_CONG','HUY') DEFAULT 'CHO_XAC_NHAN'")
    private TrangThaiDonHang trangthaidonhang;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangthaithanhtoan", columnDefinition = "ENUM('CHUA_THANH_TOAN','DA_THANH_TOAN') DEFAULT 'CHUA_THANH_TOAN'")
    private TrangThaiThanhToanDonHang trangthaithanhtoan;

    @Column(name = "ten_khach_le")
    private String tenKhachLe;

    @Column(name = "sdt_khach_le")
    private String sdtKhachLe;
}