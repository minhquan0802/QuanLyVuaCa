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

    private static final int SO_NGAY_QUA_HAN = 2;

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

        for (Chitietphieunhap lo : loQuaHan) {
            Chitietcaban kho = lo.getIdchitietcaban();
            String tenSanPham = kho.getIdloaica().getTenloaica() + " (" + kho.getIdsizeca().getSizeca() + ")";

            String noidung = String.format(
                    "Lô %s nhập ngày %s còn %skg chưa bán, đã quá hạn %d ngày. Gợi ý lập phiếu thanh lý.",
                    tenSanPham, lo.getIdphieunhap().getNgaynhap(), lo.getSoluongconlai(), SO_NGAY_QUA_HAN
            );

            // Trỏ thẳng vào trang thanh lý của đúng lô này (không phải trang danh sách chung)
            String link = "/admin/QuanLyThanhLy/thanh-ly/" + lo.getIdchitietphieunhap();
            thongBaoService.guiChoVaiTro("ADMIN", noidung, "LO_QUA_HAN", link);
        }
    }
}
