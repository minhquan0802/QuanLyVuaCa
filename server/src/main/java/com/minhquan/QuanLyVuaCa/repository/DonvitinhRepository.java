package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Donvitinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DonvitinhRepository extends JpaRepository<Donvitinh, Integer> {
    boolean existsByTendvtIgnoreCase(String tendvt);
    boolean existsByTendvtIgnoreCaseAndIdNot(String tendvt, Integer id);
}
