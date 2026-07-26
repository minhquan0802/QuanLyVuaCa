package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Phieuthanhly;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PhieuthanhlyRepository extends JpaRepository<Phieuthanhly, String> {
    @EntityGraph(attributePaths = "idnguoitaophieu")
    java.util.List<Phieuthanhly> findAllByOrderByNgaythanhlyDesc();
}
