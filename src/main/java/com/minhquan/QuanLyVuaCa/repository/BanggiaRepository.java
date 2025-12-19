package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Banggia;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BanggiaRepository extends JpaRepository<Banggia, Integer> {

    // Tìm bảng giá đang "mở" (chưa có ngày kết thúc) của 1 sản phẩm
    Optional<Banggia> findByChitietcabanAndNgayketthucIsNull(Chitietcaban chitietcaban);

    // Các hàm query cũ của bạn có thể giữ lại để xem lịch sử nếu cần
    List<Banggia> findByChitietcaban(Chitietcaban chitietcaban);
}