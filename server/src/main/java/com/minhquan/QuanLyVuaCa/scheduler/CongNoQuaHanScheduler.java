package com.minhquan.QuanLyVuaCa.scheduler;

import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.minhquan.QuanLyVuaCa.service.CongNoService;
import com.minhquan.QuanLyVuaCa.service.ThongBaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

// "Khóa đặt hàng" đã hoạt động real-time (tính trực tiếp từ ngayvuothanmuc + so-ngay-khoa, xem CongNoService) —
// job này chỉ nhắc admin mỗi ngày về các khách đang ở trạng thái bị khóa, để không bị bỏ quên xử lý
// (giống cách LoHangQuaHanScheduler nhắc lại mỗi ngày, không có cờ dedup riêng).
@Component
@RequiredArgsConstructor
public class CongNoQuaHanScheduler {

    private final TaiKhoanRepository taiKhoanRepository;
    private final CongNoService congNoService;
    private final ThongBaoService thongBaoService;

    @Scheduled(cron = "0 0 2 * * ?")
    public void canhBaoKhachDangBiKhoa() {
        List<Taikhoan> khachCoCongNo = taiKhoanRepository.findByHanmuctindungIsNotNull();

        for (Taikhoan khach : khachCoCongNo) {
            if (!congNoService.kiemTraDangBiKhoa(khach)) continue;

            String tenKhach = khach.getHo() + " " + khach.getTen();
            String noidung = String.format(
                    "Khách %s đang bị khóa đặt hàng do quá hạn công nợ (nợ %sđ / hạn mức %sđ).",
                    tenKhach, khach.getCongnohientai(), khach.getHanmuctindung()
            );

            thongBaoService.guiChoVaiTro("ADMIN", noidung, "CONG_NO_BI_KHOA", "/admin/QuanLyCongNo");
        }
    }
}
