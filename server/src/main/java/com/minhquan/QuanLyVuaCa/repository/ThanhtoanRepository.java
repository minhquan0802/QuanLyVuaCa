package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.entity.Thanhtoan;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThanhtoanRepository extends JpaRepository<Thanhtoan, String> {
    List<Thanhtoan> findByIddonhang(Donhang donhang);
    List<Thanhtoan> findByIddonhangAndTrangthai(Donhang donhang, TrangThaiThanhToan trangthai);
}
