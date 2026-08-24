package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Nhacungcap;
import com.minhquan.QuanLyVuaCa.entity.Phieunhap;
import com.minhquan.QuanLyVuaCa.entity.ThanhToanNhaCungCap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ThanhToanNhaCungCapRepository extends JpaRepository<ThanhToanNhaCungCap, String> {

    List<ThanhToanNhaCungCap> findByIdnccOrderByNgaythanhtoanDesc(Nhacungcap idncc);

    List<ThanhToanNhaCungCap> findByIdphieunhap(Phieunhap idphieunhap);

    @Query("""
        SELECT COALESCE(SUM(tt.sotien), 0)
        FROM ThanhToanNhaCungCap tt
        WHERE tt.idphieunhap = :phieunhap
    """)
    BigDecimal tongDaTraChoPhieu(@Param("phieunhap") Phieunhap phieunhap);

    // Thay thế cho cách lọc theo cờ nhị phân của Phieunhap: cộng số tiền thực trả trong khoảng,
    // nên trả góp nhiều đợt vẫn được tính đúng phần đã trả.
    @Query("""
        SELECT COALESCE(SUM(tt.sotien), 0)
        FROM ThanhToanNhaCungCap tt
        WHERE tt.ngaythanhtoan BETWEEN :tuNgay AND :denNgay
    """)
    BigDecimal tongDaTraTrongKhoang(@Param("tuNgay") Instant tuNgay, @Param("denNgay") Instant denNgay);

    /**
     * Tiền thực trả cho những phiếu nhập PHÁT SINH trong kỳ — lọc theo ngày nhập của phiếu, không
     * phải ngày trả tiền, nên trả lời đúng câu "hàng nhập kỳ này đã trả được bao nhiêu" kể cả khi
     * tiền ra ở kỳ sau.
     *
     * Khoản trả gộp không gắn phiếu (idphieunhap NULL) bị loại: join ngầm qua tt.idphieunhap là
     * inner join. Đúng bản chất — không quy được về phiếu nào thì không thể nói nó trả cho hàng
     * nhập trong kỳ.
     */
    @Query("""
        SELECT COALESCE(SUM(tt.sotien), 0)
        FROM ThanhToanNhaCungCap tt
        WHERE tt.idphieunhap.ngaynhap BETWEEN :tuNgay AND :denNgay
    """)
    BigDecimal tongDaTraChoPhieuNhapTrongKhoang(@Param("tuNgay") LocalDate tuNgay,
                                                @Param("denNgay") LocalDate denNgay);
}
