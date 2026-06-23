package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Chitietphieuthanhly;
import com.minhquan.QuanLyVuaCa.entity.Phieuthanhly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChitietphieuthanhlyRepository extends JpaRepository<Chitietphieuthanhly, String> {
    List<Chitietphieuthanhly> findByIdphieuthanhly(Phieuthanhly idphieuthanhly);
}
