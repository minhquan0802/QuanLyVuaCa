package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.LichSuCongNoNcc;
import com.minhquan.QuanLyVuaCa.entity.Nhacungcap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LichSuCongNoNccRepository extends JpaRepository<LichSuCongNoNcc, String> {

    List<LichSuCongNoNcc> findByIdnccOrderByNgaytaoDesc(Nhacungcap idncc);
}
