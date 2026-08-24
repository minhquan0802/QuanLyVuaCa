package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.NhatKyThaoTac;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface NhatKyThaoTacRepository extends JpaRepository<NhatKyThaoTac, String> {

    // Dùng cho tab "Lịch sử thay đổi" trên màn chi tiết — đây là chiều truy vấn có giá trị nhất,
    // và là lý do bắt buộc phải có index (tenbang, idbanghi).
    List<NhatKyThaoTac> findByTenbangAndIdbanghiOrderByThoigianDesc(String tenbang, String idbanghi);

    @Query("""
        SELECT nk FROM NhatKyThaoTac nk
        WHERE (:tenbang IS NULL OR nk.tenbang = :tenbang)
          AND (:hanhdong IS NULL OR nk.hanhdong = :hanhdong)
          AND (:idnguoithuchien IS NULL OR nk.nguoithuchien.idtaikhoan = :idnguoithuchien)
          AND (CAST(:tuNgay AS timestamp) IS NULL OR nk.thoigian >= :tuNgay)
          AND (CAST(:denNgay AS timestamp) IS NULL OR nk.thoigian <= :denNgay)
        ORDER BY nk.thoigian DESC
    """)
    Page<NhatKyThaoTac> timKiem(@Param("tenbang") String tenbang,
                                @Param("hanhdong") String hanhdong,
                                @Param("idnguoithuchien") String idnguoithuchien,
                                @Param("tuNgay") Instant tuNgay,
                                @Param("denNgay") Instant denNgay,
                                Pageable pageable);

    @Query("SELECT DISTINCT nk.tenbang FROM NhatKyThaoTac nk ORDER BY nk.tenbang")
    List<String> layDanhSachBang();

    @Query("SELECT DISTINCT nk.hanhdong FROM NhatKyThaoTac nk ORDER BY nk.hanhdong")
    List<String> layDanhSachHanhDong();
}
