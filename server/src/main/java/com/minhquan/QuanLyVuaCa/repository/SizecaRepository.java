package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.entity.Sizeca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SizecaRepository extends JpaRepository<Sizeca, Integer> {
    // Tìm tất cả size thuộc về một loại cá cụ thể
    boolean existsBySizeca(String sizeca);

    @Query(value = """
            SELECT *
            FROM sizeca
            WHERE LOWER(REGEXP_REPLACE(sizeca, '[[:space:]]+', '')) = :normalizedName
            LIMIT 1
            """, nativeQuery = true)
    Optional<Sizeca> findFirstByNormalizedName(@Param("normalizedName") String normalizedName);
}
