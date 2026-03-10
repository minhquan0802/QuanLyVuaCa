package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietphieunhap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChitietphieunhapRepository extends JpaRepository<Chitietphieunhap, String> {
}