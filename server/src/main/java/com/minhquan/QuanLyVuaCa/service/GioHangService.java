package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.CapNhatSoLuongRequest;
import com.minhquan.QuanLyVuaCa.dto.request.ThemVaoGioHangRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietGioHangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.GioHangResponse;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiGioHang;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.*;
import com.minhquan.QuanLyVuaCa.utils.ChinhSachGiaUtils;
import com.minhquan.QuanLyVuaCa.utils.QuyDoiKhoiLuongUtils;
import org.springframework.transaction.annotation.Transactional;
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

    // ── Lấy hoặc tạo giỏ hàng đang hoạt động của taikhoan hiện tại ──────────────
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

    private Taikhoan layTaiKhoanHienTai() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return taikhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));
    }

    // ── Map sang Response, tính giá real-time ────────────────────────────────
    private GioHangResponse xayDungGioHangResponse(GioHang gioHang, boolean laKhachSi) {
        List<ChitietGioHang> danhSachMuc = chitietGioHangRepository.findByIdgiohang_Idgiohang(gioHang.getIdgiohang());
        BigDecimal tongTien = BigDecimal.ZERO;
        List<ChitietGioHangResponse> danhSachMucResponse = new ArrayList<>();

        for (ChitietGioHang muc : danhSachMuc) {
            Chitietcaban sanpham = muc.getIdchitietcaban();
            Donvitinh donvitinh = muc.getIddonvitinh();

            BigDecimal heSoQuyDoi = QuyDoiKhoiLuongUtils.xacDinhHeSo(donvitinh, sanpham);

            BigDecimal giaBan = banggiaRepository.findByChitietcabanAndNgayketthucIsNull(sanpham)
                    .map(bg -> laKhachSi && bg.getGiabansi() != null ? bg.getGiabansi() : bg.getGiabanle())
                    .filter(gia -> gia != null && gia.compareTo(BigDecimal.ZERO) > 0)
                    .orElseThrow(() -> new AppExceptions(ErrorCode.BANGGIA_CHUA_AP_DUNG));

            BigDecimal khoiluong = heSoQuyDoi.multiply(new BigDecimal(muc.getSoluong()));
            BigDecimal thanhTien = khoiluong.multiply(giaBan);
            tongTien = tongTien.add(thanhTien);

            danhSachMucResponse.add(ChitietGioHangResponse.builder()
                    .idchitietgiohang(muc.getIdchitietgiohang())
                    .idchitietcaban(sanpham.getId())
                    .tenLoaiCa(sanpham.getIdloaica().getTenloaica())
                    .tenSize(sanpham.getIdsizeca().getSizeca())
                    .hinhAnhUrl(sanpham.getIdloaica().getHinhanhurl())
                    .iddonvitinh(donvitinh.getId())
                    .tenDonViTinh(donvitinh.getTendvt())
                    .soluong(muc.getSoluong())
                    .khoiluongDuKien(khoiluong)
                    .giaBan(giaBan)
                    .thanhTien(thanhTien)
                    .build());
        }

        return GioHangResponse.builder()
                .idgiohang(gioHang.getIdgiohang())
                .items(danhSachMucResponse)
                .tongTien(tongTien)
                .build();
    }

    // Dùng cho Phase 4 công nợ: tính nợ dự kiến trước khi cho checkout
    @Transactional(readOnly = true)
    public BigDecimal tinhTongTienGioHangHienTai(String idtaikhoan, boolean laKhachSi) {
        return gioHangRepository.findByIdtaikhoan_IdtaikhoanAndTrangthai(idtaikhoan, TrangThaiGioHang.DANG_HOAT_DONG)
                .map(gh -> xayDungGioHangResponse(gh, laKhachSi).getTongTien())
                .orElse(BigDecimal.ZERO);
    }

    // ── 1. Lấy giỏ hàng ──────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public GioHangResponse layGioHang() {
        Taikhoan taikhoan = layTaiKhoanHienTai();
        return gioHangRepository
                .findByIdtaikhoan_IdtaikhoanAndTrangthai(taikhoan.getIdtaikhoan(), TrangThaiGioHang.DANG_HOAT_DONG)
                .map(gh -> xayDungGioHangResponse(gh, ChinhSachGiaUtils.laKhachSi(taikhoan.getVaitro())))
                .orElse(GioHangResponse.builder().items(List.of()).tongTien(BigDecimal.ZERO).build());
    }

    // ── 2. Thêm sản phẩm vào giỏ ─────────────────────────────────────────────
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public GioHangResponse themSanPham(ThemVaoGioHangRequest request) {
        Taikhoan taikhoan = layTaiKhoanHienTai();
        GioHang gioHang = layHoacTaoGioHang(taikhoan);

        Chitietcaban sanpham = chitietcabanRepository.findById(request.getIdchitietcaban())
                .orElseThrow(() -> new AppExceptions(ErrorCode.CHITIET_CABAN_NOT_EXISTED,
                        "Không tìm thấy sản phẩm ID: " + request.getIdchitietcaban()));

        Donvitinh donvitinh = donvitinhRepository.findById(request.getIddonvitinh())
                .orElseThrow(() -> new AppExceptions(ErrorCode.DONVITINH_NOT_EXISTED,
                        "Không tìm thấy đơn vị tính ID: " + request.getIddonvitinh()));

        var mucHienCo = chitietGioHangRepository
                .findItem(gioHang.getIdgiohang(), sanpham.getId(), donvitinh.getId());
        int tongSoLuong = mucHienCo
                .map(muc -> muc.getSoluong() + request.getSoluong())
                .orElse(request.getSoluong());

        // Không chặn theo tồn kho ở giỏ hàng: nghiệp vụ cho phép đặt dù kho thiếu, số lượng
        // thực giao sẽ được điều chỉnh lại đúng theo tồn kho khi admin cân thực tế lúc xử lý đơn.
        mucHienCo.ifPresentOrElse(
                muc -> muc.setSoluong(tongSoLuong),
                () -> {
                    ChitietGioHang moi = new ChitietGioHang();
                    moi.setIdgiohang(gioHang);
                    moi.setIdchitietcaban(sanpham);
                    moi.setIddonvitinh(donvitinh);
                    moi.setSoluong(request.getSoluong());
                    chitietGioHangRepository.save(moi);
                }
        );

        boolean laKhachSi = ChinhSachGiaUtils.laKhachSi(taikhoan.getVaitro());
        return xayDungGioHangResponse(gioHang, laKhachSi);
    }

    // ── 3. Cập nhật số lượng (soluong = 0 → xóa luôn) ───────────────────────
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public GioHangResponse capNhatSoLuong(String idChitietGioHang, CapNhatSoLuongRequest request) {
        ChitietGioHang muc = chitietGioHangRepository.findById(idChitietGioHang)
                .orElseThrow(() -> new AppExceptions(ErrorCode.CHITIET_GIOHANG_NOT_EXISTED));

        if (request.getSoluong() == 0) {
            chitietGioHangRepository.delete(muc);
        } else {
            muc.setSoluong(request.getSoluong());
        }

        Taikhoan taikhoan = layTaiKhoanHienTai();
        boolean laKhachSi = ChinhSachGiaUtils.laKhachSi(taikhoan.getVaitro());
        return xayDungGioHangResponse(muc.getIdgiohang(), laKhachSi);
    }

    // ── 4. Xóa 1 sản phẩm khỏi giỏ ──────────────────────────────────────────
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public GioHangResponse xoaSanPham(String idChitietGioHang) {
        ChitietGioHang muc = chitietGioHangRepository.findById(idChitietGioHang)
                .orElseThrow(() -> new AppExceptions(ErrorCode.CHITIET_GIOHANG_NOT_EXISTED));

        GioHang gioHang = muc.getIdgiohang();
        chitietGioHangRepository.delete(muc);

        Taikhoan taikhoan = layTaiKhoanHienTai();
        boolean laKhachSi = ChinhSachGiaUtils.laKhachSi(taikhoan.getVaitro());
        return xayDungGioHangResponse(gioHang, laKhachSi);
    }

    // ── 5. Xóa toàn bộ giỏ ───────────────────────────────────────────────────
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public void xoaToGioHang() {
        Taikhoan taikhoan = layTaiKhoanHienTai();
        gioHangRepository.findByIdtaikhoan_IdtaikhoanAndTrangthai(taikhoan.getIdtaikhoan(), TrangThaiGioHang.DANG_HOAT_DONG)
                .ifPresent(gioHang -> chitietGioHangRepository.deleteByIdgiohang(gioHang.getIdgiohang()));
    }

}
