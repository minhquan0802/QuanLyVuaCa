package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.ChitietGioHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChitietGioHangRepository extends JpaRepository<ChitietGioHang, String> {

    List<ChitietGioHang> findByIdgiohang_Idgiohang(String idgiohang);

    @Query("SELECT c FROM ChitietGioHang c WHERE c.idgiohang.idgiohang = :idGioHang AND c.idchitietcaban.id = :idChitietCaban AND c.iddonvitinh.id = :idDonViTinh")
    Optional<ChitietGioHang> findItem(
            @Param("idGioHang") String idGioHang,
            @Param("idChitietCaban") Integer idChitietCaban,
            @Param("idDonViTinh") Integer idDonViTinh
    );

    @Modifying
    @Query("DELETE FROM ChitietGioHang c WHERE c.idgiohang.idgiohang = :idGioHang")
    void deleteByIdgiohang(@Param("idGioHang") String idGioHang);
}
