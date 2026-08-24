package com.minhquan.QuanLyVuaCa.scheduler;

import com.minhquan.QuanLyVuaCa.service.LichDatHangDinhKyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Mỗi sáng sinh đơn CHO_XAC_NHAN từ các lịch đặt định kỳ tới lượt chạy.
 *
 * Vòng lặp nằm ở đây chứ không nằm trong service là có lý do: mỗi lịch phải chạy trong một giao
 * dịch riêng, mà gọi phương thức @Transactional của chính bean mình từ bên trong sẽ đi thẳng vào
 * đối tượng thật, không qua proxy Spring — annotation bị bỏ qua và cả buổi sáng gộp chung một giao
 * dịch. Gọi từ scheduler là gọi qua proxy, nên REQUIRES_NEW có hiệu lực thật.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DonDinhKyScheduler {

    private final LichDatHangDinhKyService lichDatHangDinhKyService;

    // 5h00 sáng: đủ sớm để vựa gom đơn trước phiên chợ, đủ muộn để không đụng các job 2h đêm.
    @Scheduled(cron = "0 0 5 * * ?")
    public void sinhDonHomNay() {
        List<String> canChay = lichDatHangDinhKyService.layLichCanChayHomNay();
        if (canChay.isEmpty()) return;

        int thanhCong = 0;
        for (String idlich : canChay) {
            String iddonhang = null;
            String loi = null;
            try {
                iddonhang = lichDatHangDinhKyService.taoDonTuLich(idlich);
                thanhCong++;
            } catch (Exception e) {
                // Nuốt để lịch sau vẫn chạy; lý do thất bại được ghi lại vào chính lịch đó và báo
                // cho khách, nên không có ca nào hỏng trong im lặng.
                loi = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                log.warn("Lịch định kỳ {} không sinh được đơn: {}", idlich, loi);
            }
            lichDatHangDinhKyService.danhDauDaChay(idlich, iddonhang, loi);
        }

        log.info("Đơn định kỳ: {}/{} lịch sinh đơn thành công", thanhCong, canChay.size());
    }
}
