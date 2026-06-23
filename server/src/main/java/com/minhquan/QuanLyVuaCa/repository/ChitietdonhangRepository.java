package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Chitietdonhang;
import com.minhquan.QuanLyVuaCa.entity.Donhang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChitietdonhangRepository extends JpaRepository<Chitietdonhang, String> {
    List<Chitietdonhang> findByIddonhang(Donhang donhang);
    boolean existsByIdchitietcaban(Chitietcaban idchitietcaban);
}