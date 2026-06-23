package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.CapNhatSoLuongRequest;
import com.minhquan.QuanLyVuaCa.dto.request.ThemVaoGioHangRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietGioHangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.GioHangResponse;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiGioHang;
import com.minhquan.QuanLyVuaCa.repository.*;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GioHangService {

    GioHangRepository gioHangRepository;
    ChitietGioHangRepository chitietGioHangRepository;
    TaiKhoanRepository taikhoanRepository;
    ChitietcabanRepository chitietcabanRepository;
    DonvitinhRepository donvitinhRepository;
    BanggiaRepository banggiaRepository;
    QuydoiRepository quydoiRepository;

    // ── Lấy hoặc tạo giỏ hàng đang hoạt động của user hiện tại ──────────────
    private GioHang layHoacTaoGioHang(Taikhoan taikhoan) {
        return gioHangRepository
                .findByIdtaikhoan_IdtaikhoanAndTrangthai(taikhoan.getIdtaikhoan(), TrangThaiGioHang.DANG_HOAT_DONG)
                .orElseGet(() -> {
                    GioHang moi = new GioHang();
                    moi.setIdtaikhoan(taikhoan);
                    moi.setTrangthai(TrangThaiGioHang.DANG_HOAT_DONG);
                    return gioHangRepository.save(moi);
                });
    }

    private Taikhoan layUserHienTai() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return taikhoanRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
    }

    // ── Map sang Response, tính giá real-time ────────────────────────────────
    private GioHangResponse mapToResponse(GioHang gioHang, boolean isWholesale) {
        List<ChitietGioHang> items = chitietGioHangRepository.findByIdgiohang_Idgiohang(gioHang.getIdgiohang());
        BigDecimal tongTien = BigDecimal.ZERO;
        List<ChitietGioHangResponse> itemResponses = new ArrayList<>();

        for (ChitietGioHang item : items) {
            Chitietcaban sanpham = item.getIdchitietcaban();
            Donvitinh dvt = item.getIddonvitinh();

            BigDecimal heSoQuyDoi = quydoiRepository.findByIdchitietcaban(sanpham)
                    .map(Quydoi::getSokgtuongung)
                    .orElse(BigDecimal.ONE);

            BigDecimal giaBan = banggiaRepository.findByChitietcabanAndNgayketthucIsNull(sanpham)
                    .map(bg -> isWholesale && bg.getGiabansi() != null ? bg.getGiabansi() : bg.getGiabanle())
                    .orElse(BigDecimal.ZERO);

            BigDecimal khoiluong = heSoQuyDoi.multiply(new BigDecimal(item.getSoluong()));
            BigDecimal thanhTien = khoiluong.multiply(giaBan);
            tongTien = tongTien.add(thanhTien);

            itemResponses.add(ChitietGioHangResponse.builder()
                    .idchitietgiohang(item.getIdchitietgiohang())
                    .idchitietcaban(sanpham.getId())
                    .tenLoaiCa(sanpham.getIdloaica().getTenloaica())
                    .tenSize(sanpham.getIdsizeca().getSizeca())
                    .hinhAnhUrl(sanpham.getIdloaica().getHinhanhurl())
                    .iddonvitinh(dvt.getId())
                    .tenDonViTinh(dvt.getTendvt())
                    .soluong(item.getSoluong())
                    .khoiluongDuKien(khoiluong)
                    .giaBan(giaBan)
                    .thanhTien(thanhTien)
                    .build());
        }

        return GioHangResponse.builder()
                .idgiohang(gioHang.getIdgiohang())
                .items(itemResponses)
                .tongTien(tongTien)
                .build();
    }

    // Dùng cho Phase 4 công nợ: tính nợ dự kiến trước khi cho checkout
    public BigDecimal tinhTongTienGioHangHienTai(String idtaikhoan, boolean isWholesale) {
        return gioHangRepository.findByIdtaikhoan_IdtaikhoanAndTrangthai(idtaikhoan, TrangThaiGioHang.DANG_HOAT_DONG)
                .map(gh -> mapToResponse(gh, isWholesale).getTongTien())
                .orElse(BigDecimal.ZERO);
    }

    // ── 1. Lấy giỏ hàng ──────────────────────────────────────────────────────
    @PreAuthorize("isAuthenticated()")
    public GioHangResponse layGioHang() {
        Taikhoan user = layUserHienTai();
        return gioHangRepository
                .findByIdtaikhoan_IdtaikhoanAndTrangthai(user.getIdtaikhoan(), TrangThaiGioHang.DANG_HOAT_DONG)
                .map(gh -> mapToResponse(gh, "CUSTOMER".equals(user.getVaitro())))
                .orElse(GioHangResponse.builder().items(List.of()).tongTien(BigDecimal.ZERO).build());
    }

    // ── 2. Thêm sản phẩm vào giỏ ─────────────────────────────────────────────
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public GioHangResponse themSanPham(ThemVaoGioHangRequest request) {
        Taikhoan user = layUserHienTai();
        GioHang gioHang = layHoacTaoGioHang(user);

        Chitietcaban sanpham = chitietcabanRepository.findById(request.getIdchitietcaban())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + request.getIdchitietcaban()));

        Donvitinh dvt = donvitinhRepository.findById(request.getIddonvitinh())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn vị tính ID: " + request.getIddonvitinh()));

        chitietGioHangRepository.findItem(gioHang.getIdgiohang(), sanpham.getId(), dvt.getId())
                .ifPresentOrElse(
                        existing -> existing.setSoluong(existing.getSoluong() + request.getSoluong()),
                        () -> {
                            ChitietGioHang moi = new ChitietGioHang();
                            moi.setIdgiohang(gioHang);
                            moi.setIdchitietcaban(sanpham);
                            moi.setIddonvitinh(dvt);
                            moi.setSoluong(request.getSoluong());
                            chitietGioHangRepository.save(moi);
                        }
                );

        boolean isWholesale = "CUSTOMER".equals(user.getVaitro()) || "WHOLESALE_CUSTOMER".equals(user.getVaitro());
        return mapToResponse(gioHang, isWholesale);
    }

    // ── 3. Cập nhật số lượng (soluong = 0 → xóa luôn) ───────────────────────
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public GioHangResponse capNhatSoLuong(String idChitietGioHang, CapNhatSoLuongRequest request) {
        ChitietGioHang item = chitietGioHangRepository.findById(idChitietGioHang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm trong giỏ"));

        if (request.getSoluong() == 0) {
            chitietGioHangRepository.delete(item);
        } else {
            item.setSoluong(request.getSoluong());
        }

        Taikhoan user = layUserHienTai();
        boolean isWholesale = "CUSTOMER".equals(user.getVaitro()) || "WHOLESALE_CUSTOMER".equals(user.getVaitro());
        return mapToResponse(item.getIdgiohang(), isWholesale);
    }

    // ── 4. Xóa 1 sản phẩm khỏi giỏ ──────────────────────────────────────────
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public GioHangResponse xoaSanPham(String idChitietGioHang) {
        ChitietGioHang item = chitietGioHangRepository.findById(idChitietGioHang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm trong giỏ"));

        GioHang gioHang = item.getIdgiohang();
        chitietGioHangRepository.delete(item);

        Taikhoan user = layUserHienTai();
        boolean isWholesale = "CUSTOMER".equals(user.getVaitro()) || "WHOLESALE_CUSTOMER".equals(user.getVaitro());
        return mapToResponse(gioHang, isWholesale);
    }

    // ── 5. Xóa toàn bộ giỏ ───────────────────────────────────────────────────
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public void xoaToGioHang() {
        Taikhoan user = layUserHienTai();
        gioHangRepository.findByIdtaikhoan_IdtaikhoanAndTrangthai(user.getIdtaikhoan(), TrangThaiGioHang.DANG_HOAT_DONG)
                .ifPresent(gioHang -> chitietGioHangRepository.deleteByIdgiohang(gioHang.getIdgiohang()));
    }
}
