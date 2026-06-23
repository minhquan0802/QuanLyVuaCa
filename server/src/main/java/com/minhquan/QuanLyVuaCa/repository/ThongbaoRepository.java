package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.entity.Thongbao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThongbaoRepository extends JpaRepository<Thongbao, String> {
    List<Thongbao> findByIdnguoinhanOrderByThoigiantaoDesc(Taikhoan idnguoinhan);

    long countByIdnguoinhanAndDaxemFalse(Taikhoan idnguoinhan);
}
