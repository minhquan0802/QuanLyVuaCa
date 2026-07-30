package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.entity.Sizeca;
import com.minhquan.QuanLyVuaCa.repository.projection.ThongKeLoaiCaProjection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChitietcabanRepository extends JpaRepository<Chitietcaban, Integer> {
    boolean existsByIdloaicaAndIdsizeca(Loaica idloaica, Sizeca idsizeca);

    @EntityGraph(attributePaths = {"idloaica", "idsizeca"})
    Optional<Chitietcaban> findByIdloaicaAndIdsizeca(Loaica idloaica, Sizeca idsizeca);

    @EntityGraph(attributePaths = {"idloaica", "idsizeca"})
    List<Chitietcaban> findByIdloaicaAndDeletedTrue(Loaica idloaica);

    List<Chitietcaban> findAllByDeletedFalse();
    List<Chitietcaban> findByIdloaica(Loaica idloaica);
    boolean existsByIdloaicaAndSoluongtonGreaterThan(Loaica idloaica, java.math.BigDecimal soluongton);

    @Query("""
        SELECT ct.idloaica.id AS idLoaiCa,
               COALESCE(SUM(ct.soluongton), 0) AS tong
        FROM Chitietcaban ct
        WHERE ct.deleted = false
        GROUP BY ct.idloaica.id
    """)
    List<ThongKeLoaiCaProjection> tongTonKhoTheoTatCaLoaiCaDangHoatDong();
}
