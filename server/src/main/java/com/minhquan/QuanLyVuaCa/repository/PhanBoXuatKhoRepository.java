package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietdonhang;
import com.minhquan.QuanLyVuaCa.entity.PhanBoXuatKho;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.repository.projection.BienLoiNhuanProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PhanBoXuatKhoRepository extends JpaRepository<PhanBoXuatKho, String> {

    List<PhanBoXuatKho> findByIdchitietdonhang(Chitietdonhang idchitietdonhang);

    /** Tổng giá vốn hàng đã bán (COGS) trong khoảng — thứ phải trừ khỏi doanh thu để ra lãi thật. */
    @Query("""
        SELECT COALESCE(SUM(pb.soluong * pb.gianhaptaithoidiem), 0)
        FROM PhanBoXuatKho pb
        WHERE pb.idchitietdonhang.iddonhang.trangthaidonhang = :trangThai
          AND pb.idchitietdonhang.iddonhang.ngaydat BETWEEN :tuNgay AND :denNgay
    """)
    BigDecimal tongGiaVonTrongKhoang(@Param("trangThai") TrangThaiDonHang trangThai,
                                     @Param("tuNgay") LocalDateTime tuNgay,
                                     @Param("denNgay") LocalDateTime denNgay);

    /**
     * Doanh thu và giá vốn gộp theo từng sản phẩm (loại cá × size).
     *
     * Một dòng đơn có thể lấy hàng từ nhiều lô, nên doanh thu phải phân bổ theo tỉ lệ số lượng lấy
     * từ mỗi lô (đơn giá thực tế nhân số lượng của phần đó). Cộng thẳng tongtienthucte sẽ nhân
     * doanh thu lên theo số lô mà dòng đơn đó chạm vào.
     */
    @Query("""
        SELECT ccb.idloaica.id AS idLoaiCa,
               ccb.idloaica.tenloaica AS tenLoaiCa,
               ccb.idsizeca.sizeca AS tenSize,
               SUM(pb.soluong) AS soLuongBan,
               SUM(pb.soluong * pb.gianhaptaithoidiem) AS giaVon,
               SUM(pb.soluong * COALESCE(pb.idchitietdonhang.tongtienthucte, 0)
                   / NULLIF(pb.idchitietdonhang.khoiluongthucte, 0)) AS doanhThu
        FROM PhanBoXuatKho pb
        JOIN pb.idchitietdonhang.idchitietcaban ccb
        WHERE pb.idchitietdonhang.iddonhang.trangthaidonhang = :trangThai
          AND pb.idchitietdonhang.iddonhang.ngaydat BETWEEN :tuNgay AND :denNgay
        GROUP BY ccb.idloaica.id, ccb.idloaica.tenloaica, ccb.idsizeca.sizeca
        ORDER BY ccb.idloaica.tenloaica, ccb.idsizeca.sizeca
    """)
    List<BienLoiNhuanProjection> bienLoiNhuanTheoSanPham(@Param("trangThai") TrangThaiDonHang trangThai,
                                                          @Param("tuNgay") LocalDateTime tuNgay,
                                                          @Param("denNgay") LocalDateTime denNgay);

    /** Biên lợi nhuận gộp theo từng lô nhập — trả lời "lô này lời hay lỗ". */
    @Query("""
        SELECT pb.idchitietphieunhap.idphieunhap.idphieunhap AS idPhieuNhap,
               pb.idchitietphieunhap.idchitietphieunhap AS idLo,
               ccb.idloaica.tenloaica AS tenLoaiCa,
               ccb.idsizeca.sizeca AS tenSize,
               pb.idchitietphieunhap.idphieunhap.ngaynhap AS ngayNhap,
               SUM(pb.soluong) AS soLuongBan,
               SUM(pb.soluong * pb.gianhaptaithoidiem) AS giaVon,
               SUM(pb.soluong * COALESCE(pb.idchitietdonhang.tongtienthucte, 0)
                   / NULLIF(pb.idchitietdonhang.khoiluongthucte, 0)) AS doanhThu
        FROM PhanBoXuatKho pb
        JOIN pb.idchitietphieunhap.idchitietcaban ccb
        WHERE pb.idchitietdonhang.iddonhang.trangthaidonhang = :trangThai
          AND pb.idchitietdonhang.iddonhang.ngaydat BETWEEN :tuNgay AND :denNgay
        GROUP BY pb.idchitietphieunhap.idphieunhap.idphieunhap, pb.idchitietphieunhap.idchitietphieunhap,
                 ccb.idloaica.tenloaica, ccb.idsizeca.sizeca,
                 pb.idchitietphieunhap.idphieunhap.ngaynhap
        ORDER BY pb.idchitietphieunhap.idphieunhap.ngaynhap DESC
    """)
    List<BienLoiNhuanProjection> bienLoiNhuanTheoLo(@Param("trangThai") TrangThaiDonHang trangThai,
                                                     @Param("tuNgay") LocalDateTime tuNgay,
                                                     @Param("denNgay") LocalDateTime denNgay);
}
