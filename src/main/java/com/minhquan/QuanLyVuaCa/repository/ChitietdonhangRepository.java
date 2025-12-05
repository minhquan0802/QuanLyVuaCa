package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietdonhang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChitietdonhangRepository extends JpaRepository<Chitietdonhang, String> {
    // Tìm các chi tiết thuộc về một đơn hàng cụ thể
    List<Chitietdonhang> findByIddonhang_Iddonhang(String iddonhang);
}