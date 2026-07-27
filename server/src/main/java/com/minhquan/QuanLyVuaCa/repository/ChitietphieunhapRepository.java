package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Chitietphieunhap;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.entity.Phieunhap;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToan;
import com.minhquan.QuanLyVuaCa.repository.projection.ThongKeLoaiCaProjection;
import com.minhquan.QuanLyVuaCa.repository.projection.TonKhoConHanProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ChitietphieunhapRepository extends JpaRepository<Chitietphieunhap, String> {
    boolean existsByIdchitietcaban(Chitietcaban idchitietcaban);

    // FIFO: lô nhập trước (ngaynhap cũ hơn) được trả về trước
    List<Chitietphieunhap> findByIdchitietcabanAndSoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(
            Chitietcaban idchitietcaban, BigDecimal soluong);

    // FIFO chỉ gồm các lô đủ điều kiện bán: còn hàng và chưa quá hạn.
    List<Chitietphieunhap> findByIdchitietcabanAndSoluongconlaiGreaterThanAndIdphieunhap_NgaynhapGreaterThanEqualOrderByIdphieunhap_NgaynhapAsc(
            Chitietcaban idchitietcaban, BigDecimal soluong, LocalDate ngaynhap);

    // Tất cả lô còn hàng, không phân biệt sản phẩm — dùng cho màn hình thanh lý nhanh
    List<Chitietphieunhap> findBySoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(BigDecimal soluong);

    // Lô còn hàng nhưng đã nhập quá lâu (ngaynhap < ngưỡng) — dùng cho scheduler cảnh báo quá hạn
    List<Chitietphieunhap> findBySoluongconlaiGreaterThanAndIdphieunhap_NgaynhapLessThan(
            BigDecimal soluong, LocalDate ngaynhap);

    // Đếm số lô quá hạn (cùng điều kiện ở trên) — dùng cho ô cảnh báo trên Dashboard
    long countBySoluongconlaiGreaterThanAndIdphieunhap_NgaynhapLessThan(
            BigDecimal soluong, LocalDate ngaynhap);

    // Tổng tồn còn hạn theo từng sản phẩm kho, dùng cho các màn hình bán hàng.
    @Query("""
        SELECT ct.idchitietcaban.id AS idChitietcaban,
               COALESCE(SUM(ct.soluongconlai), 0) AS tong
        FROM Chitietphieunhap ct
        WHERE ct.soluongconlai > 0
          AND ct.idphieunhap.ngaynhap >= :nguong
        GROUP BY ct.idchitietcaban.id
    """)
    List<TonKhoConHanProjection> tongTonConHanTheoTatCaSanPham(@Param("nguong") LocalDate nguong);

    @Query("""
        SELECT COALESCE(SUM(ct.soluongconlai), 0)
        FROM Chitietphieunhap ct
        WHERE ct.idchitietcaban = :sanpham
          AND ct.soluongconlai > 0
          AND ct.idphieunhap.ngaynhap >= :nguong
    """)
    BigDecimal tongTonConHanTheoSanPham(@Param("sanpham") Chitietcaban sanpham,
                                        @Param("nguong") LocalDate nguong);

    // Lô mới nhất trước — dùng để hoàn trả tồn kho (LIFO ngược lại với FIFO lúc trừ)
    List<Chitietphieunhap> findByIdchitietcabanOrderByIdphieunhap_NgaynhapDesc(Chitietcaban idchitietcaban);

    // Tất cả chi tiết của một phiếu nhập — dùng để tính tổng tiền và hiển thị chi tiết size
    List<Chitietphieunhap> findByIdphieunhap(Phieunhap idphieunhap);

    // --- Dùng cho Dashboard thống kê ---

    // Tổng kg đã nhập của 1 loại cá trong khoảng thời gian
    @Query("""
        SELECT COALESCE(SUM(ct.soluongnhap), 0)
        FROM Chitietphieunhap ct
        WHERE ct.idchitietcaban.idloaica = :loaica
          AND ct.idphieunhap.ngaynhap BETWEEN :tuNgay AND :denNgay
    """)
    BigDecimal tongSoLuongNhapTheoLoaiCa(@Param("loaica") Loaica loaica,
                                         @Param("tuNgay") LocalDate tuNgay,
                                         @Param("denNgay") LocalDate denNgay);

    // Tổng tiền nhập hàng (số lượng x giá nhập) trong khoảng thời gian, không phân biệt loại cá
    @Query("""
        SELECT COALESCE(SUM(ct.soluongnhap * ct.gianhap), 0)
        FROM Chitietphieunhap ct
        WHERE ct.idphieunhap.ngaynhap BETWEEN :tuNgay AND :denNgay
    """)
    BigDecimal tongTienNhapTrongKhoang(@Param("tuNgay") LocalDate tuNgay,
                                       @Param("denNgay") LocalDate denNgay);

    @Query("""
        SELECT COALESCE(SUM(ct.soluongnhap * ct.gianhap), 0)
        FROM Chitietphieunhap ct
        WHERE ct.idphieunhap.ngaynhap BETWEEN :tuNgay AND :denNgay
          AND ct.idphieunhap.trangthaithanhtoan = :trangThai
    """)
    BigDecimal tongTienNhapDaThanhToanTrongKhoang(
            @Param("tuNgay") LocalDate tuNgay,
            @Param("denNgay") LocalDate denNgay,
            @Param("trangThai") TrangThaiThanhToan trangThai);

    @Query("""
        SELECT ct.idchitietcaban.idloaica.id AS idLoaiCa,
               COALESCE(SUM(ct.soluongnhap), 0) AS tong
        FROM Chitietphieunhap ct
        WHERE ct.idphieunhap.ngaynhap BETWEEN :tuNgay AND :denNgay
        GROUP BY ct.idchitietcaban.idloaica.id
    """)
    List<ThongKeLoaiCaProjection> tongSoLuongNhapTheoTatCaLoaiCa(
            @Param("tuNgay") LocalDate tuNgay,
            @Param("denNgay") LocalDate denNgay);
}
