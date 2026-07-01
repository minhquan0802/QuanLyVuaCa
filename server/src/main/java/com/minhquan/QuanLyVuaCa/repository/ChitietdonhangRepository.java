package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Chitietdonhang;
import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ChitietdonhangRepository extends JpaRepository<Chitietdonhang, String> {
    List<Chitietdonhang> findByIddonhang(Donhang donhang);
    boolean existsByIdchitietcaban(Chitietcaban idchitietcaban);

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
}