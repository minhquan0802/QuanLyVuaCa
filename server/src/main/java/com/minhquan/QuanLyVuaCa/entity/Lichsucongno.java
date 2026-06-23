package com.minhquan.QuanLyVuaCa.entity;

import com.minhquan.QuanLyVuaCa.enums.LoaiThayDoiCongNo;
import com.minhquan.QuanLyVuaCa.enums.NguonGocCongNo;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "lichsucongno")
public class Lichsucongno {
    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idlichsucongno", nullable = false, length = 36)
    private String idlichsucongno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idtaikhoan")
    private Taikhoan idtaikhoan;

    @Enumerated(EnumType.STRING)
    @Column(name = "loaithaydoi", columnDefinition = "ENUM('TANG', 'GIAM', 'DIEU_CHINH')")
    private LoaiThayDoiCongNo loaithaydoi;

    @Column(name = "sotien", precision = 12, scale = 2)
    private BigDecimal sotien;

    @Column(name = "sodusaukhithaydoi", precision = 12, scale = 2)
    private BigDecimal sodusaukhithaydoi;

    @Size(max = 36)
    @Column(name = "nguongocid", length = 36)
    private String nguongocid;

    @Enumerated(EnumType.STRING)
    @Column(name = "nguongocloai", columnDefinition = "ENUM('DON_HANG', 'THANH_TOAN')")
    private NguonGocCongNo nguongocloai;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoithuchien")
    private Taikhoan nguoithuchien;

    @Size(max = 255)
    @Column(name = "ghichu", length = 255)
    private String ghichu;

    @Column(name = "ngaytao")
    private Instant ngaytao;
}
