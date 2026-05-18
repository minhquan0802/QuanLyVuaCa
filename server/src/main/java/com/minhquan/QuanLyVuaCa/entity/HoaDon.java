package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "hoadon")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HoaDon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idhoadon", length = 36)
    String idhoadon;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "iddonhang", nullable = false, unique = true)
    Donhang donhang;

    @Column(name = "so_hoa_don", length = 20)
    String soHoaDon;

    @Column(name = "ky_hieu", length = 20)
    String kyHieu;

    // 0.05 hoặc 0.10 — nullable để sau này có thể mở rộng nhiều mức thuế
    @Column(name = "vat_rate")
    Float vatRate;

    @Column(name = "tien_hang", precision = 15, scale = 2)
    BigDecimal tienHang;

    @Column(name = "tien_thue", precision = 15, scale = 2)
    BigDecimal tienThue;

    @Column(name = "tong_thanh_toan", precision = 15, scale = 2)
    BigDecimal tongThanhToan;

    // Mã cơ quan thuế — để null khi demo, điền thật khi triển khai chính thức
    @Column(name = "ma_cqt", length = 50)
    String maCqt;

    @Column(name = "trang_thai_hoa_don", length = 20)
    String trangThaiHoaDon; // "CHUA_XUAT" / "DA_XUAT"

    @Column(name = "ngay_xuat")
    LocalDateTime ngayXuat;
}
