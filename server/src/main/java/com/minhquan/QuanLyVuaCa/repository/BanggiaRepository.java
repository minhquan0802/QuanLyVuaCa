package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Banggia;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BanggiaRepository extends JpaRepository<Banggia, Integer> {

    // Tìm bảng giá đang "mở" (chưa có ngày kết thúc) của 1 sản phẩm
    Optional<Banggia> findByChitietcabanAndNgayketthucIsNull(Chitietcaban chitietcaban);

    List<Banggia> findByChitietcaban(Chitietcaban chitietcaban);

    // Tìm giá đang hoạt động (là dòng có idchitietcaban khớp VÀ chưa có ngày kết thúc)
    @Query("SELECT b FROM Banggia b WHERE b.chitietcaban.id = :khoId AND b.ngayketthuc IS NULL")
    Banggia findActivePriceByChitietcaban(@Param("khoId") Integer khoId);
}