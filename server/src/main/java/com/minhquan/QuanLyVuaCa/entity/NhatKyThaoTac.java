package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Nhật ký thao tác (audit log) cho toàn hệ thống.
 *
 * Cặp (tenbang, idbanghi) là con trỏ đa hình tới bản ghi bị tác động — tổng quát hóa pattern
 * (nguongocloai, nguongocid) đã dùng trong Lichsucongno. Không dùng khóa ngoại vì log phải ghi
 * được mọi bảng; nếu mỗi bảng một cột FK thì bảng này sẽ có gần 20 cột mà mỗi dòng chỉ điền một.
 *
 * idbanghi để kiểu String vì khóa chính trong hệ thống không đồng nhất: Donhang/Phieunhap dùng
 * UUID String(36), còn Chitietcaban/Banggia/Nhacungcap/Sizeca dùng Integer.
 *
 * Nhật ký chỉ ghi thêm — không có API sửa/xóa, kể cả cho ADMIN.
 */
@Getter
@Setter
@Entity
@Table(name = "nhatkythaotac", indexes = {
        @Index(name = "idx_nhatky_doituong", columnList = "tenbang, idbanghi"),
        @Index(name = "idx_nhatky_nguoi_thoigian", columnList = "nguoithuchien, thoigian")
})
public class NhatKyThaoTac {

    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idnhatky", nullable = false, length = 36)
    private String idnhatky;

    @Size(max = 50)
    @Column(name = "tenbang", length = 50)
    private String tenbang;

    @Size(max = 36)
    @Column(name = "idbanghi", length = 36)
    private String idbanghi;

    @Size(max = 50)
    @Column(name = "hanhdong", length = 50)
    private String hanhdong;

    @Column(name = "giatricu", columnDefinition = "TEXT")
    private String giatricu;

    @Column(name = "giatrimoi", columnDefinition = "TEXT")
    private String giatrimoi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoithuchien")
    private Taikhoan nguoithuchien;

    @Size(max = 45)
    @Column(name = "diachiip", length = 45)
    private String diachiip;

    @Size(max = 255)
    @Column(name = "ghichu", length = 255)
    private String ghichu;

    @Column(name = "thoigian")
    private Instant thoigian;
}
