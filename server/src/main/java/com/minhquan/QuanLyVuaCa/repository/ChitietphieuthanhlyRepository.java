package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietphieuthanhly;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.entity.Phieuthanhly;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhLy;
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

    // Tổng kg thanh lý của một loại cá theo từng hình thức xử lý trong khoảng thời gian.
    @Query("""
        SELECT COALESCE(SUM(ct.soluongthanhly), 0)
        FROM Chitietphieuthanhly ct
        WHERE ct.idchitietcaban.idloaica = :loaica
          AND ct.idphieuthanhly.trangthai = :trangThai
          AND ct.idphieuthanhly.ngaythanhly BETWEEN :tuNgay AND :denNgay
    """)
    BigDecimal tongSoLuongThanhLyTheoLoaiCaVaTrangThai(
            @Param("loaica") Loaica loaica,
            @Param("trangThai") TrangThaiThanhLy trangThai,
            @Param("tuNgay") Instant tuNgay,
            @Param("denNgay") Instant denNgay);

    // Tổng tiền thu từ bán thanh lý trong khoảng thời gian. Phiếu tiêu hủy bắt buộc có đơn giá bằng 0
    // nên không làm tăng khoản thu này.
    @Query("""
        SELECT COALESCE(SUM(ct.thanhtien), 0)
        FROM Chitietphieuthanhly ct
        WHERE ct.idphieuthanhly.ngaythanhly BETWEEN :tuNgay AND :denNgay
    """)
    BigDecimal tongTienThanhLyTrongKhoang(@Param("tuNgay") Instant tuNgay,
                                          @Param("denNgay") Instant denNgay);
}
