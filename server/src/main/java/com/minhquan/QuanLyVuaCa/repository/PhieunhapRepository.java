package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Nhacungcap;
import com.minhquan.QuanLyVuaCa.entity.Phieunhap;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PhieunhapRepository extends JpaRepository<Phieunhap, String> {

    List<Phieunhap> findByIdnccOrderByNgaynhapDesc(Nhacungcap idncc);

    List<Phieunhap> findByIdnccAndTrangthaithanhtoanOrderByNgaynhapAsc(Nhacungcap idncc,
                                                                        TrangThaiThanhToan trangthaithanhtoan);

    // Phiếu còn nợ và có hạn trả rơi vào trước mốc :moc — dùng cho scheduler nhắc tới hạn.
    @Query("""
        SELECT pn FROM Phieunhap pn
        WHERE pn.trangthaithanhtoan <> :daThanhToan
          AND pn.hantra IS NOT NULL
          AND pn.hantra <= :moc
        ORDER BY pn.hantra ASC
    """)
    List<Phieunhap> timPhieuSapDenHan(@Param("daThanhToan") TrangThaiThanhToan daThanhToan,
                                      @Param("moc") LocalDate moc);

    /**
     * Phần đã trả của những phiếu cũ được đánh dấu DA_THANH_TOAN từ trước khi có bảng
     * thanhtoannhacungcap — chúng không có dòng thanh toán nào để cộng.
     *
     * Thiếu truy vấn này thì mọi kỳ trước ngày bật tính năng đều báo "đã trả 0đ", tức là sửa một
     * chỗ báo thiếu bằng cách tạo ra một chỗ báo thiếu nặng hơn.
     *
     * Phụ thuộc pn.tongtien: dữ liệu cũ phải chạy lệnh backfill tongtien trong file migration.
     */
    @Query("""
        SELECT COALESCE(SUM(pn.tongtien), 0)
        FROM Phieunhap pn
        WHERE pn.ngaynhap BETWEEN :tuNgay AND :denNgay
          AND pn.trangthaithanhtoan = :daThanhToan
          AND NOT EXISTS (
              SELECT tt FROM ThanhToanNhaCungCap tt WHERE tt.idphieunhap = pn
          )
    """)
    BigDecimal tongPhieuDaTraNhungChuaCoSoThanhToan(@Param("tuNgay") LocalDate tuNgay,
                                                    @Param("denNgay") LocalDate denNgay,
                                                    @Param("daThanhToan") TrangThaiThanhToan daThanhToan);
}
