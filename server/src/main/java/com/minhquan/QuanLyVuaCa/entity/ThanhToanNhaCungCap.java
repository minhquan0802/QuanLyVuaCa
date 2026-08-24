package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Một lần vựa trả tiền cho nhà cung cấp. Đây là thứ bảng cũ không diễn tả được: Phieunhap chỉ có
 * cờ nhị phân CHUA_THANH_TOAN/DA_THANH_TOAN nên trả 10/25 triệu vẫn bị coi là chưa trả đồng nào.
 *
 * idphieunhap có thể null: trả gộp nhiều chuyến hàng một lần là chuyện bình thường ở vựa cá.
 */
@Getter
@Setter
@Entity
@Table(name = "thanhtoannhacungcap")
public class ThanhToanNhaCungCap {

    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idthanhtoanncc", nullable = false, length = 36)
    private String idthanhtoanncc;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idncc", nullable = false)
    private Nhacungcap idncc;

    // Null khi trả gộp cho nhiều phiếu; có giá trị khi trả cho đúng một chuyến hàng.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idphieunhap")
    private Phieunhap idphieunhap;

    @Column(name = "sotien", nullable = false, precision = 18, scale = 2)
    private BigDecimal sotien;

    @Size(max = 30)
    @Column(name = "hinhthuc", length = 30)
    private String hinhthuc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoithuchien")
    private Taikhoan nguoithuchien;

    @Size(max = 255)
    @Column(name = "ghichu", length = 255)
    private String ghichu;

    @Column(name = "ngaythanhtoan")
    private Instant ngaythanhtoan;
}
