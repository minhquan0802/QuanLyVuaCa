package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Lichsucongno;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LichsucongnoRepository extends JpaRepository<Lichsucongno, String> {
    List<Lichsucongno> findByIdtaikhoanOrderByNgaytaoDesc(Taikhoan idtaikhoan);

    boolean existsByIdtaikhoan(Taikhoan idtaikhoan);
}
