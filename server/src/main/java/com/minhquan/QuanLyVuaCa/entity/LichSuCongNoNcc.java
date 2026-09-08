package com.minhquan.QuanLyVuaCa.entity;

import com.minhquan.QuanLyVuaCa.enums.LoaiThayDoiCongNo;
import com.minhquan.QuanLyVuaCa.enums.NguonGocCongNoNcc;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Sổ cái công nợ nhà cung cấp — bản soi gương của Lichsucongno phía khách hàng.
 *
 * sodusaukhithaydoi ghi lại số dư TẠI THỜI ĐIỂM phát sinh, không tính lại về sau. Đây là điều
 * làm nên giá trị của một sổ cái: đọc lại lịch sử luôn ra đúng con số hồi đó, kể cả khi dữ liệu
 * nguồn (giá nhập, tổng tiền phiếu) bị sửa sau này.
 */
@Getter
@Setter
@Entity
@Table(name = "lichsucongnoncc")
public class LichSuCongNoNcc {

    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idlichsucongnoncc", nullable = false, length = 36)
    private String idlichsucongnoncc;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idncc", nullable = false)
    private Nhacungcap idncc;

    @Enumerated(EnumType.STRING)
    @Column(name = "loaithaydoi", columnDefinition = "ENUM('TANG', 'GIAM', 'DIEU_CHINH')")
    private LoaiThayDoiCongNo loaithaydoi;

    @Column(name = "sotien", precision = 18, scale = 2)
    private BigDecimal sotien;

    @Column(name = "sodusaukhithaydoi", precision = 18, scale = 2)
    private BigDecimal sodusaukhithaydoi;

    @Size(max = 36)
    @Column(name = "nguongocid", length = 36)
    private String nguongocid;

    @Enumerated(EnumType.STRING)
    @Column(name = "nguongocloai", columnDefinition = "ENUM('PHIEU_NHAP', 'THANH_TOAN_NCC')")
    private NguonGocCongNoNcc nguongocloai;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoithuchien")
    private Taikhoan nguoithuchien;

    @Size(max = 255)
    @Column(name = "ghichu", length = 255)
    private String ghichu;

    @Column(name = "ngaytao")
    private Instant ngaytao;
}
