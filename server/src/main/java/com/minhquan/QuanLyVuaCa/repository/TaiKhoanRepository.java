package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiTaiKhoan;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaiKhoanRepository extends JpaRepository<Taikhoan, String> {
    boolean existsByEmail(String email);
    Optional<Taikhoan> findByEmail(String email);
    List<Taikhoan> findByTrangthaitk(TrangThaiTaiKhoan trangthaitk);
    List<Taikhoan> findByVaitro(String vaitro);
    List<Taikhoan> findByHanmuctindungIsNotNull();

    // Khoá row đến hết transaction — dùng khi tăng/giảm congnohientai để tránh lost update
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Taikhoan t WHERE t.idtaikhoan = :idtaikhoan")
    Optional<Taikhoan> timTheoIdDeKhoa(@Param("idtaikhoan") String idtaikhoan);
}
