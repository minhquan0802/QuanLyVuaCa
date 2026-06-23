package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Chitietphieunhap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ChitietphieunhapRepository extends JpaRepository<Chitietphieunhap, String> {
    boolean existsByIdchitietcaban(Chitietcaban idchitietcaban);

    // FIFO: lô nhập trước (ngaynhap cũ hơn) được trả về trước
    List<Chitietphieunhap> findByIdchitietcabanAndSoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(
            Chitietcaban idchitietcaban, BigDecimal soluong);
}