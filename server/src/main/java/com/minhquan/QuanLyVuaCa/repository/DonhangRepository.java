package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToanDonHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonhangRepository extends JpaRepository<Donhang, String> {

    // 1. Tìm đơn hàng theo ID khách hàng
    List<Donhang> findByIdthongtinkhachhang(String idthongtinkhachhang);

    // 2. Lấy tất cả đơn hàng sắp xếp ngày mới nhất
    List<Donhang> findAllByOrderByNgaydatDesc();

    // 3. Tìm đơn đã giao nhưng chưa thanh toán đủ (để áp dụng số dư), cũ nhất trước
    List<Donhang> findByIdthongtinkhachhangAndTrangthaidonhangAndTrangthaithanhtoanOrderByNgaydatAsc(
            String idthongtinkhachhang,
            TrangThaiDonHang trangthaidonhang,
            TrangThaiThanhToanDonHang trangthaithanhtoan);
}