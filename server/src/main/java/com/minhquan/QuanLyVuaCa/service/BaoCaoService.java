package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.response.BienLoiNhuanResponse;
import com.minhquan.QuanLyVuaCa.dto.response.HaoHutCanResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LaiLoTongQuanResponse;
import com.minhquan.QuanLyVuaCa.entity.Nhacungcap;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.repository.ChitietdonhangRepository;
import com.minhquan.QuanLyVuaCa.repository.ChitietphieunhapRepository;
import com.minhquan.QuanLyVuaCa.repository.ChitietphieuthanhlyRepository;
import com.minhquan.QuanLyVuaCa.repository.NhacungcapRepository;
import com.minhquan.QuanLyVuaCa.repository.PhanBoXuatKhoRepository;
import com.minhquan.QuanLyVuaCa.repository.ThanhToanNhaCungCapRepository;
import com.minhquan.QuanLyVuaCa.repository.projection.BienLoiNhuanProjection;
import com.minhquan.QuanLyVuaCa.repository.projection.HaoHutCanProjection;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;

/**
 * Báo cáo lãi/lỗ và hao hụt — phần khai thác dữ liệu mà Dashboard hiện tại chưa chạm tới.
 *
 * Hai điểm khác biệt so với ThongKeService:
 *  1. Lãi được tính trên GIÁ VỐN HÀNG BÁN (từ phanboxuatkho), không phải chi phí nhập hàng trong
 *     kỳ. Cá nhập tháng này mà còn nằm trong bể thì chưa phải chi phí của doanh thu tháng này.
 *  2. "Hao hụt" ở đây là hao hụt CÂN (dự kiến vs thực tế), khác với thanh lý + tiêu hủy đang được
 *     gọi là hao hụt trong bảng luân chuyển hàng hóa.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BaoCaoService {

    ChitietdonhangRepository chitietdonhangRepository;
    ChitietphieunhapRepository chitietphieunhapRepository;
    ChitietphieuthanhlyRepository chitietphieuthanhlyRepository;
    PhanBoXuatKhoRepository phanBoXuatKhoRepository;
    ThanhToanNhaCungCapRepository thanhToanNhaCungCapRepository;
    NhacungcapRepository nhacungcapRepository;
    ThongKeService thongKeService;

    // @NonFinal là bắt buộc ở đây: @FieldDefaults(makeFinal = true) làm field thành final, khiến
    // @RequiredArgsConstructor đưa nó vào constructor và Spring đi tìm một bean BigDecimal thay vì
    // đọc giá trị cấu hình.
    @NonFinal
    @Value("${bao-cao.nguong-hao-hut-phan-tram:5}")
    BigDecimal nguongHaoHut;

    @Transactional(readOnly = true)
    public LaiLoTongQuanResponse laiLoTongQuan(String range, LocalDate from, LocalDate to) {
        ThongKeService.KhoangThoiGian khoang = thongKeService.xacDinhKhoangThoiGian(range, from, to);
        LocalDateTime tuNgay = khoang.tuNgay();
        LocalDateTime denNgay = khoang.denNgay();

        BigDecimal doanhThu = khongNull(chitietdonhangRepository.tongDoanhThuTrongKhoang(
                TrangThaiDonHang.GIAO_HANG_THANH_CONG, tuNgay, denNgay));

        BigDecimal giaVon = khongNull(phanBoXuatKhoRepository.tongGiaVonTrongKhoang(
                TrangThaiDonHang.GIAO_HANG_THANH_CONG, tuNgay, denNgay));

        BigDecimal chiPhiMuaHang = khongNull(chitietphieunhapRepository.tongTienNhapTrongKhoang(
                tuNgay.toLocalDate(), denNgay.toLocalDate()));

        BigDecimal tienDaTraNcc = khongNull(thanhToanNhaCungCapRepository.tongDaTraTrongKhoang(
                tuNgay.atZone(ZoneId.systemDefault()).toInstant(),
                denNgay.atZone(ZoneId.systemDefault()).toInstant()));

        BigDecimal thuThanhLy = khongNull(chitietphieuthanhlyRepository.tongTienThanhLyTrongKhoang(
                tuNgay.atZone(ZoneId.systemDefault()).toInstant(),
                denNgay.atZone(ZoneId.systemDefault()).toInstant()));

        BigDecimal congNoNcc = nhacungcapRepository.findAll().stream()
                .map(Nhacungcap::getCongnophaitra)
                .map(this::khongNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal loiNhuanGop = doanhThu.subtract(giaVon);

        return LaiLoTongQuanResponse.builder()
                .doanhThu(doanhThu)
                .giaVonHangBan(giaVon)
                .loiNhuanGop(loiNhuanGop)
                .bienLoiNhuanGop(tinhPhanTram(loiNhuanGop, doanhThu))
                .chiPhiMuaHangTrongKy(chiPhiMuaHang)
                .tienDaTraNcc(tienDaTraNcc)
                .congNoNccConLai(congNoNcc)
                .thuTuBanThanhLy(thuThanhLy)
                .build();
    }

    @Transactional(readOnly = true)
    public List<BienLoiNhuanResponse> bienLoiNhuanTheoSanPham(String range, LocalDate from, LocalDate to) {
        ThongKeService.KhoangThoiGian khoang = thongKeService.xacDinhKhoangThoiGian(range, from, to);
        return phanBoXuatKhoRepository
                .bienLoiNhuanTheoSanPham(TrangThaiDonHang.GIAO_HANG_THANH_CONG,
                        khoang.tuNgay(), khoang.denNgay())
                .stream()
                .map(this::toBienLoiNhuan)
                .sorted(Comparator.comparing(BienLoiNhuanResponse::getLoiNhuanGop))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BienLoiNhuanResponse> bienLoiNhuanTheoLo(String range, LocalDate from, LocalDate to) {
        ThongKeService.KhoangThoiGian khoang = thongKeService.xacDinhKhoangThoiGian(range, from, to);
        return phanBoXuatKhoRepository
                .bienLoiNhuanTheoLo(TrangThaiDonHang.GIAO_HANG_THANH_CONG,
                        khoang.tuNgay(), khoang.denNgay())
                .stream()
                .map(this::toBienLoiNhuan)
                .toList();
    }

    /**
     * Báo cáo hao hụt cân theo loại cá × size.
     *
     * Đọc dấu của tyLeLech:
     *  - Âm có hệ thống: định mức sokgtuongung đặt cao hơn thực tế, khách luôn nhận ít hơn số kg
     *    hiển thị lúc đặt — nguồn khiếu nại thường trực, cần hiệu chỉnh định mức.
     *  - Dương có hệ thống: định mức đặt thấp, vựa xuất kho nhiều hơn dự kiến mà không nhận ra.
     */
    @Transactional(readOnly = true)
    public List<HaoHutCanResponse> haoHutCan(String range, LocalDate from, LocalDate to) {
        ThongKeService.KhoangThoiGian khoang = thongKeService.xacDinhKhoangThoiGian(range, from, to);

        return chitietdonhangRepository
                .thongKeHaoHutCan(TrangThaiDonHang.GIAO_HANG_THANH_CONG, khoang.tuNgay(), khoang.denNgay())
                .stream()
                .map(this::toHaoHutCan)
                // Lệch mạnh nhất lên đầu, bất kể lệch theo chiều nào.
                .sorted(Comparator.comparing((HaoHutCanResponse hh) -> hh.getTyLeLech().abs()).reversed())
                .toList();
    }

    private HaoHutCanResponse toHaoHutCan(HaoHutCanProjection projection) {
        BigDecimal duKien = khongNull(projection.getTongKgDuKien());
        BigDecimal thucTe = khongNull(projection.getTongKgThucTe());
        BigDecimal chenhLech = thucTe.subtract(duKien);
        BigDecimal tyLe = tinhPhanTram(chenhLech, duKien);

        return HaoHutCanResponse.builder()
                .idLoaiCa(projection.getIdLoaiCa())
                .tenLoaiCa(projection.getTenLoaiCa())
                .tenSize(projection.getTenSize())
                .tongKgDuKien(duKien)
                .tongKgThucTe(thucTe)
                .chenhLech(chenhLech)
                .tyLeLech(tyLe)
                .soDongDon(projection.getSoDongDon() != null ? projection.getSoDongDon() : 0L)
                .vuotNguong(tyLe.abs().compareTo(nguongHaoHut) > 0)
                .build();
    }

    private BienLoiNhuanResponse toBienLoiNhuan(BienLoiNhuanProjection projection) {
        BigDecimal doanhThu = khongNull(projection.getDoanhThu());
        BigDecimal giaVon = khongNull(projection.getGiaVon());
        BigDecimal loiNhuan = doanhThu.subtract(giaVon);

        return BienLoiNhuanResponse.builder()
                .tenLoaiCa(projection.getTenLoaiCa())
                .tenSize(projection.getTenSize())
                .idPhieuNhap(projection.getIdPhieuNhap())
                .idLo(projection.getIdLo())
                .ngayNhap(projection.getNgayNhap())
                .soLuongBan(khongNull(projection.getSoLuongBan()))
                .doanhThu(doanhThu)
                .giaVon(giaVon)
                .loiNhuanGop(loiNhuan)
                .bienLoiNhuan(tinhPhanTram(loiNhuan, doanhThu))
                .build();
    }

    private BigDecimal tinhPhanTram(BigDecimal tuSo, BigDecimal mauSo) {
        if (mauSo == null || mauSo.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return tuSo.multiply(BigDecimal.valueOf(100))
                .divide(mauSo, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal khongNull(BigDecimal giaTri) {
        return giaTri != null ? giaTri : BigDecimal.ZERO;
    }
}
