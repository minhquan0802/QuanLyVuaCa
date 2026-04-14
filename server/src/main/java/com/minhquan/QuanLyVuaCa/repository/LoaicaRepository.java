package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Loaica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoaicaRepository extends JpaRepository<Loaica, Integer> {
    boolean existsByTenloaica(String tenloaica);
    // Đếm số lượng loại cá đang sử dụng hình ảnh này
    long countByHinhanhurl(String hinhanhurl);
}
