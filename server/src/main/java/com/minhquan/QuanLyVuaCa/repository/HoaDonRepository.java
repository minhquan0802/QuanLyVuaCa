package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.entity.HoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, String> {

    Optional<HoaDon> findByDonhang(Donhang donhang);

    boolean existsByDonhang(Donhang donhang);
}
