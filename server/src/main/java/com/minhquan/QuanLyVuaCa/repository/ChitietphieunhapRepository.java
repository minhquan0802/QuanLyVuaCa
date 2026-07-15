package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Chitietphieunhap;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.entity.Phieunhap;
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

    // Tất cả lô còn hàng, không phân biệt sản phẩm — dùng cho màn hình thanh lý nhanh
    List<Chitietphieunhap> findBySoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(BigDecimal soluong);

    // Lô còn hàng nhưng đã nhập quá lâu (ngaynhap <= ngưỡng) — dùng cho scheduler cảnh báo quá hạn
    List<Chitietphieunhap> findBySoluongconlaiGreaterThanAndIdphieunhap_NgaynhapLessThanEqual(
            BigDecimal soluong, LocalDate ngaynhap);

    // Đếm số lô quá hạn (cùng điều kiện ở trên) — dùng cho ô cảnh báo trên Dashboard
    long countBySoluongconlaiGreaterThanAndIdphieunhap_NgaynhapLessThanEqual(
            BigDecimal soluong, LocalDate ngaynhap);

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
}