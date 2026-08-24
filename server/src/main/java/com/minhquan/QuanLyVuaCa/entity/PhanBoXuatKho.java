package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Ghi lại việc một dòng đơn hàng lấy hàng từ lô nhập nào, số lượng bao nhiêu, giá nhập bao nhiêu.
 *
 * Lý do tồn tại: truLoFifo() trong DonhangService đã trừ kho theo FIFO đúng và tại đúng dòng lệnh
 * đó hệ thống BIẾT lô nào bị trừ bao nhiêu — nhưng nó chỉ ghi đè Chitietphieunhap.soluongconlai
 * rồi vứt thông tin đi. Ghi đè là phép phá hủy: sau đó không còn cách nào tính ngược lại giá vốn.
 *
 * Bảng này là sổ cái của phần đó, nên gianhaptaithoidiem phải chốt cứng — sửa giá nhập trên lô về
 * sau không được làm thay đổi giá vốn của những đơn đã bán.
 *
 * Quy ước dấu: soluong > 0 là xuất kho, soluong < 0 là hoàn trả lại lô (đơn bị hủy, hoặc cân thực
 * tế nhẹ hơn dự kiến). Giá vốn của một dòng đơn = SUM(soluong * gianhaptaithoidiem).
 */
@Getter
@Setter
@Entity
@Table(name = "phanboxuatkho", indexes = {
        @Index(name = "idx_phanbo_ctdh", columnList = "idchitietdonhang"),
        @Index(name = "idx_phanbo_lo", columnList = "idchitietphieunhap")
})
public class PhanBoXuatKho {

    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idphanbo", nullable = false, length = 36)
    private String idphanbo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idchitietdonhang", nullable = false)
    private Chitietdonhang idchitietdonhang;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idchitietphieunhap", nullable = false)
    private Chitietphieunhap idchitietphieunhap;

    @Column(name = "soluong", nullable = false, precision = 12, scale = 2)
    private BigDecimal soluong;

    @Column(name = "gianhaptaithoidiem", precision = 12, scale = 2)
    private BigDecimal gianhaptaithoidiem;

    @Column(name = "ngaytao")
    private Instant ngaytao;
}
