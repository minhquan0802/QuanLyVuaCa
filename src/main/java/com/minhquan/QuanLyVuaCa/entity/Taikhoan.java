package com.minhquan.QuanLyVuaCa.entity;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiTaiKhoan;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

@Getter
@Setter
@Entity
@Table(name = "taikhoan")
public class Taikhoan {
    @Id
    @Size(max = 36)
    @Column(name = "idtaikhoan", nullable = false, length = 36)
    private String idtaikhoan;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idvaitro", nullable = false)
    private Vaitro idvaitro;

    @Size(max = 50)
    @Column(name = "ho", length = 50)
    private String ho;

    @Size(max = 10)
    @Column(name = "ten", length = 10)
    private String ten;

    @Size(max = 36)
    @Column(name = "matkhau", length = 36)
    private String matkhau;

    @Size(max = 50)
    @Column(name = "email", length = 50)
    private String email;

    @Size(max = 15)
    @Column(name = "sodienthoai", length = 15)
    private String sodienthoai;

    @Size(max = 80)
    @Column(name = "diachi", length = 80)
    private String diachi;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangthaitk", columnDefinition = "ENUM('HOAT_DONG','KHOA')")
    private TrangThaiTaiKhoan trangthaitk;

}