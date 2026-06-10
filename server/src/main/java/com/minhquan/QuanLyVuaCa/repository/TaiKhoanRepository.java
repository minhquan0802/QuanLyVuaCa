package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiTaiKhoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaiKhoanRepository extends JpaRepository<Taikhoan, String> {
    boolean existsByEmail(String email);
    Optional<Taikhoan> findByEmail(String email);
    List<Taikhoan> findByTrangthaitk(TrangThaiTaiKhoan trangthaitk);
}
