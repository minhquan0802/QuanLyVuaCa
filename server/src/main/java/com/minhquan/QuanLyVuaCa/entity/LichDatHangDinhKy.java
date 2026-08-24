package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Lịch đặt hàng lặp lại của khách sỉ — nhà hàng, quán ăn thường lấy gần như cùng một giỏ mỗi ngày.
 *
 * Lịch KHÔNG tự sinh đơn đã chốt: mỗi sáng scheduler tạo đơn ở trạng thái CHO_XAC_NHAN, đúng như
 * khách tự bấm đặt. Cá là hàng tươi, số lượng thực giao còn phải cân lại, nên không có lý do gì
 * để đơn định kỳ đi tắt qua bước xác nhận.
 */
@Getter
@Setter
@Entity
@Table(name = "lichdathangdinhky")
public class LichDatHangDinhKy {

    @Id
    @Size(max = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "idlich", nullable = false, length = 36)
    private String idlich;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idtaikhoan", nullable = false)
    private Taikhoan idtaikhoan;

    @Size(max = 100)
    @Column(name = "tenlich", length = 100)
    private String tenlich;

    /**
     * Các thứ trong tuần cần sinh đơn, lưu dạng "1,3,5" theo chuẩn ISO (1 = thứ Hai … 7 = Chủ nhật).
     *
     * Chuỗi thay vì bảng con: tập giá trị cố định đúng 7 phần tử và không bao giờ cần JOIN hay lọc
     * theo từng thứ ở tầng SQL — scheduler lấy các lịch đang bật rồi so khớp trong Java.
     */
    @Size(max = 20)
    @Column(name = "cacngaytrongtuan", length = 20)
    private String cacngaytrongtuan;

    @Column(name = "ngaybatdau")
    private LocalDate ngaybatdau;

    // Null nghĩa là chạy vô thời hạn cho tới khi khách tắt lịch.
    @Column(name = "ngayketthuc")
    private LocalDate ngayketthuc;

    @Column(name = "dangkichhoat", nullable = false)
    private Boolean dangkichhoat = true;

    /**
     * Ngày gần nhất scheduler đã xử lý lịch này. Đây là chốt chặn trùng đơn: server khởi động lại
     * giữa ngày, hoặc job bị gọi hai lần, thì lịch đã chạy hôm nay sẽ bị bỏ qua thay vì sinh đơn
     * thứ hai cho cùng một buổi sáng.
     */
    @Column(name = "lanchaycuoi")
    private LocalDate lanchaycuoi;

    // Ghi lại vì sao lần chạy gần nhất không tạo được đơn (vượt hạn mức công nợ, hết bảng giá…).
    @Size(max = 255)
    @Column(name = "loilanchaycuoi", length = 255)
    private String loilanchaycuoi;

    @Size(max = 255)
    @Column(name = "ghichu", length = 255)
    private String ghichu;

    @Column(name = "ngaytao")
    private Instant ngaytao;
}
