package com.minhquan.QuanLyVuaCa.scheduler;

import com.minhquan.QuanLyVuaCa.service.CongNoNccService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Bản soi gương của CongNoQuaHanScheduler: bên kia nhắc khách nợ mình, bên này nhắc mình nợ ghe.
 *
 * Khác một điểm quan trọng — phía khách hàng chỉ nhắc khi ĐÃ quá hạn (vì đã có cơ chế khóa đặt
 * hàng chặn từ trước), còn ở đây phải nhắc TRƯỚC hạn: trả tiền ghe trễ thì mất uy tín, mà hệ thống
 * không có cách nào tự chặn hộ.
 */
@Component
@RequiredArgsConstructor
public class CongNoNccDenHanScheduler {

    private final CongNoNccService congNoNccService;

    @Value("${cong-no-ncc.so-ngay-nhac-truoc:2}")
    private int soNgayNhacTruoc;

    // 2h05 sáng, ngay sau CongNoQuaHanScheduler (2h00) để hai job không chen nhau.
    @Scheduled(cron = "0 5 2 * * ?")
    public void nhacPhieuDenHan() {
        congNoNccService.nhacPhieuDenHan(soNgayNhacTruoc);
    }
}
