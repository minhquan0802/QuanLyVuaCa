package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Một dòng trong giỏ mẫu của lịch định kỳ.
 *
 * Cố tình KHÔNG lưu giá: giá cá đổi theo ngày, lịch chỉ mô tả "lấy gì, bao nhiêu". Giá được áp
 * tại thời điểm sinh đơn, đi qua đúng bảng giá đang hiệu lực như mọi đơn khác.
 */
@Getter
@Setter
@Entity
@Table(name = "chitietlichdathang")
public class ChiTietLichDatHang {

    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idchitietlich", nullable = false, length = 36)
    private String idchitietlich;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idlich", nullable = false)
    private LichDatHangDinhKy idlich;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idchitietcaban", nullable = false)
    private Chitietcaban idchitietcaban;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "iddonvitinh", nullable = false)
    private Donvitinh iddonvitinh;

    @Column(name = "soluong", nullable = false)
    private Integer soluong;
}
