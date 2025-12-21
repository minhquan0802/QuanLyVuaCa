package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Quydoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QuydoiRepository extends JpaRepository<Quydoi, Integer> {
    // Tìm quy đổi theo sản phẩm kho
    Optional<Quydoi> findByIdchitietcaban(Chitietcaban chitietcaban);
}