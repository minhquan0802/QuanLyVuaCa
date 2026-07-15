package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.response.DeXuatNhapHangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LuanChuyenHangHoaResponse;
import com.minhquan.QuanLyVuaCa.dto.response.ThongKeTongQuanResponse;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Chitietphieunhap;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.repository.*;
import com.minhquan.QuanLyVuaCa.scheduler.LoHangQuaHanScheduler;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

    // Số ngày bán hàng gần đây dùng để tính tốc độ bán khi gợi ý nhập hàng
    static final int SO_NGAY_TINH_TOC_DO_BAN = 30;
    // Dưới ngưỡng này (số ngày hàng còn đủ bán) thì coi là cần nhập gấp
    static final int NGUONG_NGAY_GAP = 7;
    // Dưới ngưỡng này thì coi là cần chú ý, nên nhập thêm
    static final int NGUONG_NGAY_VUA = 15;

    LoaicaRepository loaicaRepository;
    ChitietcabanRepository chitietcabanRepository;
    ChitietphieunhapRepository chitietphieunhapRepository;
    ChitietdonhangRepository chitietdonhangRepository;
    ChitietphieuthanhlyRepository chitietphieuthanhlyRepository;
    DonhangRepository donhangRepository;

    // --- KHU VỰC 1: 4 THẺ KPI TÀI CHÍNH ---
    @Transactional(readOnly = true)
    public ThongKeTongQuanResponse tinhTongQuan(String range) {
        LocalDateTime tuNgay = tinhNgayBatDau(range);
        LocalDateTime denNgay = LocalDateTime.now();

        BigDecimal tongDoanhThu = chitietdonhangRepository.tongDoanhThuTrongKhoang(
                TrangThaiDonHang.GIAO_HANG_THANH_CONG, tuNgay, denNgay);

        BigDecimal chiPhiNhapHang = chitietphieunhapRepository.tongTienNhapTrongKhoang(
                tuNgay.toLocalDate(), denNgay.toLocalDate());

        BigDecimal chiPhiPhatSinh = chitietphieuthanhlyRepository.tongTienThanhLyTrongKhoang(
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
                .chiPhiPhatSinh(chiPhiPhatSinh)
                .donHoanThanh(donHoanThanh)
                .soLoQuaHan(soLoQuaHan)
                .build();
    }

    // --- KHU VỰC 2: BẢNG/BIỂU ĐỒ LUÂN CHUYỂN HÀNG HÓA (NHẬP - BÁN - HAO HỤT THEO LOẠI CÁ) ---
    @Transactional(readOnly = true)
    public List<LuanChuyenHangHoaResponse> tinhLuanChuyenHangHoa(String range) {
        LocalDateTime tuNgay = tinhNgayBatDau(range);
        LocalDateTime denNgay = LocalDateTime.now();

        List<LuanChuyenHangHoaResponse> ketQua = new ArrayList<>();
        for (Loaica loaica : layDanhSachLoaiCaChuaXoa()) {
            BigDecimal nhap = chitietphieunhapRepository.tongSoLuongNhapTheoLoaiCa(
                    loaica, tuNgay.toLocalDate(), denNgay.toLocalDate());

            BigDecimal ban = chitietdonhangRepository.tongSoLuongBanTheoLoaiCa(
                    loaica, TrangThaiDonHang.GIAO_HANG_THANH_CONG, tuNgay, denNgay);

            BigDecimal haohut = chitietphieuthanhlyRepository.tongSoLuongThanhLyTheoLoaiCa(
                    loaica, toInstant(tuNgay), toInstant(denNgay));

            ketQua.add(LuanChuyenHangHoaResponse.builder()
                    .name(loaica.getTenloaica())
                    .nhap(nhap)
                    .ban(ban)
                    .haohut(haohut)
                    .build());
        }
        return ketQua;
    }

    // --- KHU VỰC 3: GỢI Ý NHẬP HÀNG (SẢN PHẨM BÁN CHẠY NHƯNG SẮP HẾT) ---
    @Transactional(readOnly = true)
    public List<DeXuatNhapHangResponse> tinhDeXuatNhapHang() {
        LocalDateTime tuNgay = LocalDateTime.now().minusDays(SO_NGAY_TINH_TOC_DO_BAN);
        LocalDateTime denNgay = LocalDateTime.now();

        List<DeXuatNhapHangResponse> ketQua = new ArrayList<>();
        for (Loaica loaica : layDanhSachLoaiCaChuaXoa()) {
            List<Chitietcaban> khoTheoSize = chitietcabanRepository.findByIdloaica(loaica);

            BigDecimal tonKho = khoTheoSize.stream()
                    .map(Chitietcaban::getSoluongton)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal daBanGanDay = chitietdonhangRepository.tongSoLuongBanTheoLoaiCa(
                    loaica, TrangThaiDonHang.GIAO_HANG_THANH_CONG, tuNgay, denNgay);
            BigDecimal tocDoBan = daBanGanDay.divide(BigDecimal.valueOf(SO_NGAY_TINH_TOC_DO_BAN), 2, RoundingMode.HALF_UP);

            // Không bán được thì không có cơ sở để đề xuất nhập thêm
            if (tocDoBan.compareTo(BigDecimal.ZERO) <= 0) continue;

            BigDecimal soNgayConLai = tonKho.divide(tocDoBan, 2, RoundingMode.HALF_UP);

            String mucDo;
            if (soNgayConLai.compareTo(BigDecimal.valueOf(NGUONG_NGAY_GAP)) < 0) {
                mucDo = "GAP";
            } else if (soNgayConLai.compareTo(BigDecimal.valueOf(NGUONG_NGAY_VUA)) < 0) {
                mucDo = "VUA";
            } else {
                continue; // còn đủ hàng dùng lâu, không cần đề xuất
            }

            // Đề xuất nhập đủ dùng cho 30 ngày bán tiếp theo
            BigDecimal deXuatNhap = tocDoBan.multiply(BigDecimal.valueOf(SO_NGAY_TINH_TOC_DO_BAN))
                    .subtract(tonKho)
                    .setScale(0, RoundingMode.UP);

            BigDecimal giaNhapGanNhat = timGiaNhapGanNhat(khoTheoSize);
            BigDecimal giaDapUng = deXuatNhap.multiply(giaNhapGanNhat);

            ketQua.add(DeXuatNhapHangResponse.builder()
                    .id(loaica.getId())
                    .name(loaica.getTenloaica())
                    .tonKho(tonKho)
                    .tocDoBan(tocDoBan)
                    .deXuatNhap(deXuatNhap)
                    .mucDo(mucDo)
                    .giaDapUng(giaDapUng)
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

    // Giá nhập trung bình của lần nhập gần nhất, tính trên tất cả size của 1 loại cá (dùng để dự toán tiền nhập)
    private BigDecimal timGiaNhapGanNhat(List<Chitietcaban> khoTheoSize) {
        List<BigDecimal> danhSachGiaNhap = new ArrayList<>();
        for (Chitietcaban kho : khoTheoSize) {
            List<Chitietphieunhap> lichSuNhap =
                    chitietphieunhapRepository.findByIdchitietcabanOrderByIdphieunhap_NgaynhapDesc(kho);
            if (!lichSuNhap.isEmpty() && lichSuNhap.get(0).getGianhap() != null) {
                danhSachGiaNhap.add(lichSuNhap.get(0).getGianhap());
            }
        }
        if (danhSachGiaNhap.isEmpty()) return BigDecimal.ZERO;

        BigDecimal tong = danhSachGiaNhap.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return tong.divide(BigDecimal.valueOf(danhSachGiaNhap.size()), 2, RoundingMode.HALF_UP);
    }

    // Quy đổi mốc thời gian lọc theo range được chọn trên Dashboard
    private LocalDateTime tinhNgayBatDau(String range) {
        LocalDate homNay = LocalDate.now();
        return switch (range) {
            case "TODAY" -> homNay.atStartOfDay();
            case "THIS_WEEK" -> homNay.minusDays(homNay.getDayOfWeek().getValue() - 1).atStartOfDay();
            case "THIS_YEAR" -> homNay.withDayOfYear(1).atStartOfDay();
            default -> homNay.withDayOfMonth(1).atStartOfDay(); // THIS_MONTH
        };
    }

    private Instant toInstant(LocalDateTime thoiGian) {
        return thoiGian.atZone(ZoneId.systemDefault()).toInstant();
    }
}
