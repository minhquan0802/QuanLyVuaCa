package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "phieuthanhly")
public class Phieuthanhly {
    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idphieuthanhly", nullable = false, length = 36)
    private String idphieuthanhly;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idnguoitaophieu")
    private Taikhoan idnguoitaophieu;

    @Column(name = "ngaythanhly")
    private Instant ngaythanhly;

    @Size(max = 50)
    @Column(name = "lydothanhly", length = 50)
    private String lydothanhly;

    @Size(max = 50)
    @Column(name = "ghichu", length = 50)
    private String ghichu;

}