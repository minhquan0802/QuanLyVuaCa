package com.minhquan.QuanLyVuaCa.entity;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiTaiKhoan;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "taikhoan")
public class Taikhoan {
    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idtaikhoan", nullable = false, length = 36)
    String idtaikhoan;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idvaitro", nullable = false)
    Vaitro idvaitro;

    @Size(max = 50)
    @Column(name = "ho", length = 50)
    String ho;

    @Size(max = 10)
    @Column(name = "ten", length = 10)
    String ten;

    @Size(min = 8, max = 255)
    @Column(name = "matkhau", length = 60)
    String matkhau;

    @Size(max = 50)
    @Column(name = "email", length = 50)
    String email;

    @Size(max = 15)
    @Column(name = "sodienthoai", length = 15)
    String sodienthoai;

    @Size(max = 80)
    @Column(name = "diachi", length = 80)
    String diachi;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangthaitk", columnDefinition = "ENUM('HOAT_DONG','KHOA')")
    TrangThaiTaiKhoan trangthaitk;

}