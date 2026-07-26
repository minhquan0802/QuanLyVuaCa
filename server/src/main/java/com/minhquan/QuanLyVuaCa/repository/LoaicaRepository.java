package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Loaica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoaicaRepository extends JpaRepository<Loaica, Integer> {
    boolean existsByTenloaica(String tenloaica);
    boolean existsByTenloaicaIgnoreCase(String tenloaica);
    boolean existsByTenloaicaIgnoreCaseAndIdNot(String tenloaica, Integer id);
    List<Loaica> findAllByDeletedFalse();
    // Đếm số lượng loại cá đang sử dụng hình ảnh này
    long countByHinhanhurl(String hinhanhurl);
}
