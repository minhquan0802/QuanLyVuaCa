package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.entity.Sizeca;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChitietcabanRepository extends JpaRepository<Chitietcaban, Integer> {
    // Kiểm tra Size này đã có trong kho chưa
    boolean existsByIdloaicaAndIdsizeca(Loaica idloaica,Sizeca idsizeca);
    Optional<Chitietcaban> findByIdloaicaAndIdsizeca(Loaica idloaica, Sizeca idsizeca);
}