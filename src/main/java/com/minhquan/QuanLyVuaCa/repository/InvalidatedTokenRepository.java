package com.minhquan.QuanLyVuaCa.repository;

import com.minhquan.QuanLyVuaCa.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String> {
}
