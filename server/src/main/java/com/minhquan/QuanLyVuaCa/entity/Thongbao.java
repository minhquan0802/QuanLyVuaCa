package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "thongbao")
public class Thongbao {
    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idthongbao", nullable = false, length = 36)
    private String idthongbao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idnguoinhan")
    private Taikhoan idnguoinhan;

    @Size(max = 255)
    @Column(name = "noidung", length = 255)
    private String noidung;

    @Size(max = 50)
    @Column(name = "loai", length = 50)
    private String loai;

    @Size(max = 255)
    @Column(name = "link", length = 255)
    private String link;

    @Column(name = "daxem")
    private Boolean daxem;

    @Column(name = "thoigiantao")
    private Instant thoigiantao;
}
