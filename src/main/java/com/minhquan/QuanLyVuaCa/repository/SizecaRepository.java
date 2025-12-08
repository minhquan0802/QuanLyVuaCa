package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.entity.Sizeca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SizecaRepository extends JpaRepository<Sizeca, Integer> {
    // Tìm tất cả size thuộc về một loại cá cụ thể
    List<Sizeca> findByIdloaica(Loaica loaica);
}