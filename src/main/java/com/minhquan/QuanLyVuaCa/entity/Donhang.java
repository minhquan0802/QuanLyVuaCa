package com.minhquan.QuanLyVuaCa.entity;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiDonHang;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

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
    private Instant ngaydat;


    @Enumerated(EnumType.STRING)
    @Column(name = "trangthaidonhang", columnDefinition = "ENUM('CHO_XAC_NHAN','DANG_DONG_HANG', 'DANG_VAN_CHUYEN', 'HOAN_TAT' 'HUY') ColumnDefault 'CHO_XAC_NHAN'")
    private TrangThaiDonHang trangthaidonhang;

}