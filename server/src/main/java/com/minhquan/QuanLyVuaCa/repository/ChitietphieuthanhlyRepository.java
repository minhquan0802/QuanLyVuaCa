package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietphieuthanhly;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.entity.Phieuthanhly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Repository
public interface ChitietphieuthanhlyRepository extends JpaRepository<Chitietphieuthanhly, String> {
    List<Chitietphieuthanhly> findByIdphieuthanhly(Phieuthanhly idphieuthanhly);

    // --- Dùng cho Dashboard thống kê ---

    // Tổng kg đã thanh lý (hao hụt) của 1 loại cá trong khoảng thời gian
    @Query("""
        SELECT COALESCE(SUM(ct.soluongthanhly), 0)
        FROM Chitietphieuthanhly ct
        WHERE ct.idchitietcaban.idloaica = :loaica
          AND ct.idphieuthanhly.ngaythanhly BETWEEN :tuNgay AND :denNgay
    """)
    BigDecimal tongSoLuongThanhLyTheoLoaiCa(@Param("loaica") Loaica loaica,
                                            @Param("tuNgay") Instant tuNgay,
                                            @Param("denNgay") Instant denNgay);

    // Tổng giá trị ghi nhận từ các phiếu thanh lý (mọi loại cá) trong khoảng thời gian —
    // dùng làm "chi phí phát sinh" trên Dashboard (hàng tiêu hủy thường = 0đ, hàng bán thanh lý sẽ có giá trị)
    @Query("""
        SELECT COALESCE(SUM(ct.thanhtien), 0)
        FROM Chitietphieuthanhly ct
        WHERE ct.idphieuthanhly.ngaythanhly BETWEEN :tuNgay AND :denNgay
    """)
    BigDecimal tongTienThanhLyTrongKhoang(@Param("tuNgay") Instant tuNgay,
                                          @Param("denNgay") Instant denNgay);
}
