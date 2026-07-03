package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.entity.Sizeca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChitietcabanRepository extends JpaRepository<Chitietcaban, Integer> {
    boolean existsByIdloaicaAndIdsizeca(Loaica idloaica, Sizeca idsizeca);
    Optional<Chitietcaban> findByIdloaicaAndIdsizeca(Loaica idloaica, Sizeca idsizeca);
    List<Chitietcaban> findAllByDeletedFalse();
    List<Chitietcaban> findByIdloaica(Loaica idloaica);
    boolean existsByIdloaicaAndSoluongtonGreaterThan(Loaica idloaica, java.math.BigDecimal soluongton);
}