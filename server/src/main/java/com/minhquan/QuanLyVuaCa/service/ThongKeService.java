package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.response.LuanChuyenHangHoaResponse;
import com.minhquan.QuanLyVuaCa.dto.response.ThongKeTongQuanResponse;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhLy;
import com.minhquan.QuanLyVuaCa.repository.*;
import com.minhquan.QuanLyVuaCa.scheduler.LoHangQuaHanScheduler;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

// Tính toán số liệu cho trang Dashboard admin (AdminDashboard.jsx)
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ThongKeService {

    LoaicaRepository loaicaRepository;
    ChitietcabanRepository chitietcabanRepository;
    ChitietphieunhapRepository chitietphieunhapRepository;
    ChitietdonhangRepository chitietdonhangRepository;
    ChitietphieuthanhlyRepository chitietphieuthanhlyRepository;
    DonhangRepository donhangRepository;

    // --- KHU VỰC 1: 4 THẺ KPI TÀI CHÍNH ---
    @Transactional(readOnly = true)
    public ThongKeTongQuanResponse tinhTongQuan(String range, LocalDate from, LocalDate to) {
        KhoangThoiGian khoang = tinhKhoangThoiGian(range, from, to);
        LocalDateTime tuNgay = khoang.tuNgay();
        LocalDateTime denNgay = khoang.denNgay();

        BigDecimal tongDoanhThu = chitietdonhangRepository.tongDoanhThuTrongKhoang(
                TrangThaiDonHang.GIAO_HANG_THANH_CONG, tuNgay, denNgay);

        BigDecimal chiPhiNhapHang = chitietphieunhapRepository.tongTienNhapTrongKhoang(
                tuNgay.toLocalDate(), denNgay.toLocalDate());

        BigDecimal thuTuBanThanhLy = chitietphieuthanhlyRepository.tongTienThanhLyTrongKhoang(
                toInstant(tuNgay), toInstant(denNgay));

        long donHoanThanh = donhangRepository.countByTrangthaidonhangAndNgaydatBetween(
                TrangThaiDonHang.GIAO_HANG_THANH_CONG, tuNgay, denNgay);

        // Không phụ thuộc range (TODAY/THIS_WEEK/...) - đây là trạng thái tồn kho hiện tại,
        // không phải KPI phát sinh trong khoảng thời gian đang lọc.
        long soLoQuaHan = chitietphieunhapRepository.countBySoluongconlaiGreaterThanAndIdphieunhap_NgaynhapLessThanEqual(
                BigDecimal.ZERO, LocalDate.now().minusDays(LoHangQuaHanScheduler.SO_NGAY_QUA_HAN));

        return ThongKeTongQuanResponse.builder()
                .tongDoanhThu(tongDoanhThu)
                .chiPhiNhapHang(chiPhiNhapHang)
                .thuTuBanThanhLy(thuTuBanThanhLy)
                .donHoanThanh(donHoanThanh)
                .soLoQuaHan(soLoQuaHan)
                .build();
    }

    // --- KHU VỰC 2: BẢNG/BIỂU ĐỒ LUÂN CHUYỂN HÀNG HÓA (NHẬP - BÁN - HAO HỤT THEO LOẠI CÁ) ---
    @Transactional(readOnly = true)
    public List<LuanChuyenHangHoaResponse> tinhLuanChuyenHangHoa(String range, LocalDate from, LocalDate to) {
        KhoangThoiGian khoang = tinhKhoangThoiGian(range, from, to);
        LocalDateTime tuNgay = khoang.tuNgay();
        LocalDateTime denNgay = khoang.denNgay();

        List<LuanChuyenHangHoaResponse> ketQua = new ArrayList<>();
        for (Loaica loaica : layDanhSachLoaiCaChuaXoa()) {
            BigDecimal nhap = chitietphieunhapRepository.tongSoLuongNhapTheoLoaiCa(
                    loaica, tuNgay.toLocalDate(), denNgay.toLocalDate());

            BigDecimal ban = chitietdonhangRepository.tongSoLuongBanTheoLoaiCa(
                    loaica, TrangThaiDonHang.GIAO_HANG_THANH_CONG, tuNgay, denNgay);

            BigDecimal banThanhLy = chitietphieuthanhlyRepository.tongSoLuongThanhLyTheoLoaiCaVaTrangThai(
                    loaica, TrangThaiThanhLy.DA_BAN_THANH_LY, toInstant(tuNgay), toInstant(denNgay));

            BigDecimal tieuHuy = chitietphieuthanhlyRepository.tongSoLuongThanhLyTheoLoaiCaVaTrangThai(
                    loaica, TrangThaiThanhLy.DA_TIEU_HUY, toInstant(tuNgay), toInstant(denNgay));

            // Tồn kho là số lượng thực tế đang có tại thời điểm xem Dashboard,
            // không được suy ra từ nhập - bán - hao hụt trong khoảng thời gian lọc.
            BigDecimal tonKho = chitietcabanRepository.findByIdloaica(loaica).stream()
                    .map(Chitietcaban::getSoluongton)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            ketQua.add(LuanChuyenHangHoaResponse.builder()
                    .name(loaica.getTenloaica())
                    .nhap(nhap)
                    .ban(ban)
                    .banThanhLy(banThanhLy)
                    .tieuHuy(tieuHuy)
                    .tonKho(tonKho)
                    .build());
        }
        return ketQua;
    }

    // --- HÀM PHỤ ---

    private List<Loaica> layDanhSachLoaiCaChuaXoa() {
        return loaicaRepository.findAll().stream()
                .filter(loaica -> !Boolean.TRUE.equals(loaica.getDeleted()))
                .toList();
    }

    // Quy đổi bộ lọc nhanh hoặc khoảng ngày tùy chọn thành mốc đầu/cuối đầy đủ.
    private KhoangThoiGian tinhKhoangThoiGian(String range, LocalDate from, LocalDate to) {
        LocalDate homNay = LocalDate.now();
        if ("CUSTOM".equals(range)) {
            if (from == null || to == null || from.isAfter(to)) {
                throw new IllegalArgumentException("Khoảng thời gian tùy chọn không hợp lệ");
            }
            return new KhoangThoiGian(from.atStartOfDay(), to.plusDays(1).atStartOfDay().minusNanos(1));
        }

        LocalDate ngayBatDau = switch (range) {
            case "TODAY" -> homNay;
            case "THIS_WEEK" -> homNay.minusDays(homNay.getDayOfWeek().getValue() - 1);
            case "THIS_QUARTER" -> homNay.withMonth(((homNay.getMonthValue() - 1) / 3) * 3 + 1).withDayOfMonth(1);
            case "THIS_YEAR" -> homNay.withDayOfYear(1);
            default -> homNay.withDayOfMonth(1); // THIS_MONTH
        };
        return new KhoangThoiGian(ngayBatDau.atStartOfDay(), LocalDateTime.now());
    }

    private record KhoangThoiGian(LocalDateTime tuNgay, LocalDateTime denNgay) {}

    private Instant toInstant(LocalDateTime thoiGian) {
        return thoiGian.atZone(ZoneId.systemDefault()).toInstant();
    }
}
