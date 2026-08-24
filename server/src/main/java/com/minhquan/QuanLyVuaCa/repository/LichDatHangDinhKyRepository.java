package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.LichDatHangDinhKy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LichDatHangDinhKyRepository extends JpaRepository<LichDatHangDinhKy, String> {

    List<LichDatHangDinhKy> findByIdtaikhoan_IdtaikhoanOrderByNgaytaoDesc(String idtaikhoan);

    /**
     * Các lịch đủ điều kiện chạy trong ngày :homNay.
     *
     * Điều kiện lanchaycuoi khác homNay là chốt chặn trùng đơn — xem LichDatHangDinhKy.lanchaycuoi.
     * Việc lọc theo thứ trong tuần làm ở tầng Java vì cacngaytrongtuan là chuỗi "1,3,5".
     */
    @Query("""
        SELECT l
        FROM LichDatHangDinhKy l
        WHERE l.dangkichhoat = true
          AND (l.ngaybatdau IS NULL OR l.ngaybatdau <= :homNay)
          AND (l.ngayketthuc IS NULL OR l.ngayketthuc >= :homNay)
          AND (l.lanchaycuoi IS NULL OR l.lanchaycuoi <> :homNay)
    """)
    List<LichDatHangDinhKy> timLichCanChay(@Param("homNay") LocalDate homNay);
}
