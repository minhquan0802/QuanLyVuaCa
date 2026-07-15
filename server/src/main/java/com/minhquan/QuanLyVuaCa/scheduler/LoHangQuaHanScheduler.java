package com.minhquan.QuanLyVuaCa.scheduler;

import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Chitietphieunhap;
import com.minhquan.QuanLyVuaCa.repository.ChitietphieunhapRepository;
import com.minhquan.QuanLyVuaCa.service.ThongBaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class LoHangQuaHanScheduler {

    // public: ThongKeService/PhieuthanhlyService dùng chung ngưỡng này, tránh định nghĩa "quá hạn" lệch nhau
    public static final int SO_NGAY_QUA_HAN = 2;

    private final ChitietphieunhapRepository chitietphieunhapRepository;
    private final ThongBaoService thongBaoService;

    // "0 * * * * ?" nghĩa là giây thứ 0 của mỗi phút, mỗi giờ, mỗi ngày
//    @Scheduled(cron = "0 * * * * ?")
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void canhBaoLoHangQuaHan() {
        LocalDate nguong = LocalDate.now().minusDays(SO_NGAY_QUA_HAN);

        List<Chitietphieunhap> loQuaHan = chitietphieunhapRepository
                .findBySoluongconlaiGreaterThanAndIdphieunhap_NgaynhapLessThanEqual(BigDecimal.ZERO, nguong);

        if (loQuaHan.isEmpty()) return;

        // Gộp thành 1 thông báo duy nhất mỗi lần chạy (thay vì 1 thông báo/lô) để tránh dồn thông báo
        // trùng khi có nhiều lô quá hạn cùng lúc. Scheduler vẫn chạy lại mỗi ngày nên 1 lô bị bỏ quên
        // sẽ tiếp tục được nhắc mỗi ngày cho tới khi được xử lý - không lo bị quên mất.
        String noidung;
        String link;
        if (loQuaHan.size() == 1) {
            Chitietphieunhap lo = loQuaHan.get(0);
            Chitietcaban kho = lo.getIdchitietcaban();
            String tenSanPham = kho.getIdloaica().getTenloaica() + " (" + kho.getIdsizeca().getSizeca() + ")";

            noidung = String.format(
                    "Lô %s nhập ngày %s còn %skg chưa bán, đã quá hạn %d ngày. Gợi ý lập phiếu thanh lý.",
                    tenSanPham, lo.getIdphieunhap().getNgaynhap(), lo.getSoluongconlai(), SO_NGAY_QUA_HAN
            );
            // Chỉ 1 lô -> trỏ thẳng vào trang thanh lý của đúng lô đó
            link = "/admin/QuanLyThanhLy/thanh-ly/" + lo.getIdchitietphieunhap();
        } else {
            noidung = String.format(
                    "Có %d lô hàng quá hạn %d ngày chưa bán, cần lập phiếu thanh lý.",
                    loQuaHan.size(), SO_NGAY_QUA_HAN
            );
            // Nhiều lô -> trỏ vào tab "Lô hàng đã quá hạn" để admin tự chọn xử lý
            link = "/admin/QuanLyThanhLy?tab=quahan";
        }

        thongBaoService.guiChoVaiTro("ADMIN", noidung, "LO_QUA_HAN", link);
    }
}
