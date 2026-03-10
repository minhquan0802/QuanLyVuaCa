package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Donhang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonhangRepository extends JpaRepository<Donhang, String> {    // Sửa lại tên hàm cho đúng với tên biến trong Entity (idthongtinkhachhang)

    // 1. Tìm đơn hàng theo ID khách hàng
    List<Donhang> findByIdthongtinkhachhang(String idthongtinkhachhang);

    // 2. Lấy tất cả đơn hàng sắp xếp ngày mới nhất
    List<Donhang> findAllByOrderByNgaydatDesc();
}