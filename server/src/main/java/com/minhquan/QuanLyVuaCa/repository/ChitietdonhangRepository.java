package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Chitietdonhang;
import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.entity.Donvitinh;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.repository.projection.ThongKeLoaiCaProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChitietdonhangRepository extends JpaRepository<Chitietdonhang, String> {
    List<Chitietdonhang> findByIddonhang(Donhang donhang);
    List<Chitietdonhang> findByIddonhangIn(List<Donhang> donhangs);
    boolean existsByIdchitietcaban(Chitietcaban idchitietcaban);
    boolean existsByIddonvitinh(Donvitinh iddonvitinh);

    // Tổng kg dự kiến của các đơn KHÁC (trừ idDonhangHienTai) đang trong trạng thái chờ xử lý
    @Query("""
        SELECT COALESCE(SUM(ct.khoiluongdukien), 0)
        FROM Chitietdonhang ct
        WHERE ct.idchitietcaban = :kho
          AND ct.iddonhang.trangthaidonhang IN :trangThais
          AND ct.iddonhang.iddonhang <> :idDonhangHienTai
    """)
    BigDecimal tongKgDangChoKhac(
            @Param("kho") Chitietcaban kho,
            @Param("trangThais") List<TrangThaiDonHang> trangThais,
            @Param("idDonhangHienTai") String idDonhangHienTai);

    // --- Dùng cho Dashboard thống kê ---

    // Tổng kg đã giao thành công của 1 loại cá trong khoảng thời gian (dùng cho bảng luân chuyển hàng hóa
    // và cho tính tốc độ bán khi gợi ý nhập hàng)
    @Query("""
        SELECT COALESCE(SUM(ct.khoiluongthucte), 0)
        FROM Chitietdonhang ct
        WHERE ct.idchitietcaban.idloaica = :loaica
          AND ct.iddonhang.trangthaidonhang = :trangThai
          AND ct.iddonhang.ngaydat BETWEEN :tuNgay AND :denNgay
    """)
    BigDecimal tongSoLuongBanTheoLoaiCa(@Param("loaica") Loaica loaica,
                                        @Param("trangThai") TrangThaiDonHang trangThai,
                                        @Param("tuNgay") LocalDateTime tuNgay,
                                        @Param("denNgay") LocalDateTime denNgay);

    // Tổng doanh thu thực tế (mọi loại cá) trong khoảng thời gian
    @Query("""
        SELECT COALESCE(SUM(ct.tongtienthucte), 0)
        FROM Chitietdonhang ct
        WHERE ct.iddonhang.trangthaidonhang = :trangThai
          AND ct.iddonhang.ngaydat BETWEEN :tuNgay AND :denNgay
    """)
    BigDecimal tongDoanhThuTrongKhoang(@Param("trangThai") TrangThaiDonHang trangThai,
                                       @Param("tuNgay") LocalDateTime tuNgay,
                                       @Param("denNgay") LocalDateTime denNgay);

    @Query("""
        SELECT ct.idchitietcaban.idloaica.id AS idLoaiCa,
               COALESCE(SUM(ct.khoiluongthucte), 0) AS tong
        FROM Chitietdonhang ct
        WHERE ct.iddonhang.trangthaidonhang = :trangThai
          AND ct.iddonhang.ngaydat BETWEEN :tuNgay AND :denNgay
        GROUP BY ct.idchitietcaban.idloaica.id
    """)
    List<ThongKeLoaiCaProjection> tongSoLuongBanTheoTatCaLoaiCa(
            @Param("trangThai") TrangThaiDonHang trangThai,
            @Param("tuNgay") LocalDateTime tuNgay,
            @Param("denNgay") LocalDateTime denNgay);
}
