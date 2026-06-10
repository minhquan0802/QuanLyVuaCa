package com.minhquan.QuanLyVuaCa.scheduler;

import com.minhquan.QuanLyVuaCa.enums.TrangThaiGioHang;
import com.minhquan.QuanLyVuaCa.repository.GioHangRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class GioHangScheduler {

    private final GioHangRepository gioHangRepository;

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void dongBangGioHangBoQuen() {
        LocalDateTime nguongThoiGian = LocalDateTime.now().minusDays(30);
        int soLuong = gioHangRepository.dongBangGioHangCu(
                TrangThaiGioHang.DANG_HOAT_DONG,
                TrangThaiGioHang.BO,
                nguongThoiGian
        );
    }
}
