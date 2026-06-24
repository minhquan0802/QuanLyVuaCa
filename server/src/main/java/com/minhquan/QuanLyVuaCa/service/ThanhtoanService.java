package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.response.ThanhtoanItemResponse;
import com.minhquan.QuanLyVuaCa.dto.response.TinhTrangThanhToanResponse;
import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.entity.Thanhtoan;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToan;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.DonhangRepository;
import com.minhquan.QuanLyVuaCa.repository.ThanhtoanRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ThanhtoanService {

    ThanhtoanRepository thanhtoanRepository;
    DonhangRepository donhangRepository;
    DonhangService donhangService;
    CongNoService congNoService;

    @PreAuthorize("isAuthenticated()")
    public TinhTrangThanhToanResponse getTinhTrang(String idDonhang) {
        Donhang dh = donhangRepository.findById(idDonhang)
                .orElseThrow(() -> new AppExceptions(ErrorCode.DONHANG_NOT_EXISTED));

        BigDecimal tongTien = donhangService.tinhTongTienDonHang(idDonhang);

        List<Thanhtoan> lichSu = thanhtoanRepository.findByIddonhang(dh);

        BigDecimal daTra = lichSu.stream()
                .filter(t -> TrangThaiThanhToan.DA_THANH_TOAN.equals(t.getTrangthai()))
                .map(Thanhtoan::getSotien)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal conNo = tongTien.subtract(daTra).max(BigDecimal.ZERO);

        List<ThanhtoanItemResponse> items = lichSu.stream()
                .map(t -> ThanhtoanItemResponse.builder()
                        .idthanhtoan(t.getIdthanhtoan())
                        .sotien(t.getSotien())
                        .phuongthuc(t.getPhuongthuc())
                        .trangthai(t.getTrangthai().name())
                        .ngaythanhtoan(t.getNgaythanhtoan())
                        .ghichu(t.getGhichu())
                        .build())
                .collect(Collectors.toList());

        return TinhTrangThanhToanResponse.builder()
                .iddonhang(idDonhang)
                .tongTien(tongTien)
                .daTra(daTra)
                .conNo(conNo)
                .daThanhToanHet(conNo.compareTo(BigDecimal.ZERO) == 0)
                .lichSuThanhToan(items)
                .build();
    }

    // Tạo bản ghi chờ xác nhận cho chuyển khoản ngân hàng
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public Thanhtoan taoBienBanChuyenKhoan(String idDonhang, BigDecimal sotien, String ghichu) {
        Donhang dh = donhangRepository.findById(idDonhang)
                .orElseThrow(() -> new AppExceptions(ErrorCode.DONHANG_NOT_EXISTED));

        Thanhtoan t = new Thanhtoan();
        t.setIddonhang(dh);
        t.setSotien(sotien);
        t.setPhuongthuc("CHUYEN_KHOAN");
        t.setTrangthai(TrangThaiThanhToan.CHO_XAC_NHAN);
        t.setNgaythanhtoan(LocalDateTime.now());
        t.setGhichu(ghichu);
        return thanhtoanRepository.save(t);
    }

    // Tạo bản ghi VNPAY trước khi redirect (để dùng idthanhtoan làm vnp_TxnRef)
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public Thanhtoan taoBienBanVnpay(String idDonhang, BigDecimal sotien) {
        Donhang dh = donhangRepository.findById(idDonhang)
                .orElseThrow(() -> new AppExceptions(ErrorCode.DONHANG_NOT_EXISTED));

        Thanhtoan t = new Thanhtoan();
        t.setIddonhang(dh);
        t.setSotien(sotien);
        t.setPhuongthuc("VNPAY");
        t.setTrangthai(TrangThaiThanhToan.CHO_XAC_NHAN);
        t.setNgaythanhtoan(LocalDateTime.now());
        return thanhtoanRepository.save(t);
    }

    // Gọi từ VNPay callback hoặc admin xác nhận chuyển khoản
    @Transactional
    public void xacNhanThanhToan(String idThanhtoan) {
        Thanhtoan t = thanhtoanRepository.findById(idThanhtoan)
                .orElseThrow(() -> new AppExceptions(ErrorCode.THANHTOAN_NOT_EXISTED, "Không tìm thấy bản ghi thanh toán: " + idThanhtoan));

        t.setTrangthai(TrangThaiThanhToan.DA_THANH_TOAN);
        thanhtoanRepository.save(t);

        congNoService.xuLyThanhToanXacNhan(t);

        // Kiểm tra đã trả đủ chưa → cập nhật trạng thái đơn hàng
        String idDonhang = t.getIddonhang().getIddonhang();
        BigDecimal tongTien = donhangService.tinhTongTienDonHang(idDonhang);

        List<Thanhtoan> daPaid = thanhtoanRepository.findByIddonhangAndTrangthai(
                t.getIddonhang(), TrangThaiThanhToan.DA_THANH_TOAN);
        BigDecimal daTra = daPaid.stream().map(Thanhtoan::getSotien).reduce(BigDecimal.ZERO, BigDecimal::add);

        if (daTra.compareTo(tongTien) >= 0) {
            Donhang dh = t.getIddonhang();
            dh.setTrangthaidonhang(TrangThaiDonHang.DA_THANH_TOAN);
            donhangRepository.save(dh);
        }
    }
}
