package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.ChiTietLichDatHang;
import com.minhquan.QuanLyVuaCa.entity.LichDatHangDinhKy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChiTietLichDatHangRepository extends JpaRepository<ChiTietLichDatHang, String> {

    List<ChiTietLichDatHang> findByIdlich(LichDatHangDinhKy idlich);

    void deleteByIdlich(LichDatHangDinhKy idlich);
}
