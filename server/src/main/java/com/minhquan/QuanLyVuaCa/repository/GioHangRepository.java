package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.GioHang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiGioHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GioHangRepository extends JpaRepository<GioHang, String> {

    Optional<GioHang> findByIdtaikhoan_IdtaikhoanAndTrangthai(String idtaikhoan, TrangThaiGioHang trangthai);

    List<GioHang> findAllByIdtaikhoan_Idtaikhoan(String idtaikhoan);

    @Modifying
    @Query("UPDATE GioHang g SET g.trangthai = :trangthaiMoi WHERE g.trangthai = :trangthaiCu AND g.ngaycapnhat < :nguong")
    int dongBangGioHangCu(TrangThaiGioHang trangthaiCu, TrangThaiGioHang trangthaiMoi, LocalDateTime nguong);
}
