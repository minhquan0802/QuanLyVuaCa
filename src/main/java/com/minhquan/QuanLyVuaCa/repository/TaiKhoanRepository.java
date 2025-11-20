package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.Tam.TaiKhoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaiKhoanRepository extends JpaRepository<TaiKhoan, String> {
}
