package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.CapNhatSoLuongRequest;
import com.minhquan.QuanLyVuaCa.dto.request.ThemVaoGioHangRequest;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiGioHang;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GioHangServiceTest {

    @Mock GioHangRepository gioHangRepository;
    @Mock ChitietGioHangRepository chitietGioHangRepository;
    @Mock TaiKhoanRepository taikhoanRepository;
    @Mock ChitietcabanRepository chitietcabanRepository;
    @Mock DonvitinhRepository donvitinhRepository;
    @Mock BanggiaRepository banggiaRepository;

    GioHangService gioHangService;
    Taikhoan user;
    GioHang gioHang;
    Chitietcaban sanPham;
    Donvitinh donViTinh;

    @BeforeEach
    void setUp() {
        gioHangService = new GioHangService(gioHangRepository, chitietGioHangRepository,
                taikhoanRepository, chitietcabanRepository, donvitinhRepository, banggiaRepository);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("khach@vuaca.vn", null, List.of()));

        user = new Taikhoan();
        user.setIdtaikhoan("kh-1");
        user.setEmail("khach@vuaca.vn");
        user.setVaitro("CUSTOMER");

        gioHang = new GioHang();
        gioHang.setIdgiohang("gh-1");
        gioHang.setIdtaikhoan(user);
        gioHang.setTrangthai(TrangThaiGioHang.DANG_HOAT_DONG);

        Loaica loaiCa = new Loaica();
        loaiCa.setTenloaica("Cá điêu hồng");
        Sizeca sizeCa = new Sizeca();
        sizeCa.setSizeca("1 kg");
        sanPham = Chitietcaban.builder()
                .id(1).idloaica(loaiCa).idsizeca(sizeCa)
                .sokgtuongung(new BigDecimal("1.20"))
                .soluongton(new BigDecimal("20"))
                .build();

        donViTinh = new Donvitinh();
        donViTinh.setId(1);
        donViTinh.setTendvt("Con");
        donViTinh.setHesokg(BigDecimal.ZERO);

        lenient().when(taikhoanRepository.findByEmail("khach@vuaca.vn")).thenReturn(Optional.of(user));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void themSanPhamMoi_taoChiTietGioHangDungSoLuong() {
        when(gioHangRepository.findByIdtaikhoan_IdtaikhoanAndTrangthai("kh-1", TrangThaiGioHang.DANG_HOAT_DONG))
                .thenReturn(Optional.of(gioHang));
        when(chitietcabanRepository.findById(1)).thenReturn(Optional.of(sanPham));
        when(donvitinhRepository.findById(1)).thenReturn(Optional.of(donViTinh));
        when(chitietGioHangRepository.findItem("gh-1", 1, 1)).thenReturn(Optional.empty());
        when(chitietGioHangRepository.findByIdgiohang_Idgiohang("gh-1")).thenReturn(List.of());

        gioHangService.themSanPham(new ThemVaoGioHangRequest(1, 1, 3));

        verify(chitietGioHangRepository).save(argThat(item ->
                item.getIdgiohang() == gioHang
                        && item.getIdchitietcaban() == sanPham
                        && item.getIddonvitinh() == donViTinh
                        && item.getSoluong() == 3));
    }

    @Test
    void themSanPhamDaCo_congDonSoLuongKhongTaoDongMoi() {
        ChitietGioHang existing = new ChitietGioHang();
        existing.setIdgiohang(gioHang);
        existing.setIdchitietcaban(sanPham);
        existing.setIddonvitinh(donViTinh);
        existing.setSoluong(2);

        when(gioHangRepository.findByIdtaikhoan_IdtaikhoanAndTrangthai("kh-1", TrangThaiGioHang.DANG_HOAT_DONG))
                .thenReturn(Optional.of(gioHang));
        when(chitietcabanRepository.findById(1)).thenReturn(Optional.of(sanPham));
        when(donvitinhRepository.findById(1)).thenReturn(Optional.of(donViTinh));
        when(chitietGioHangRepository.findItem("gh-1", 1, 1)).thenReturn(Optional.of(existing));
        when(chitietGioHangRepository.findByIdgiohang_Idgiohang("gh-1")).thenReturn(List.of());

        gioHangService.themSanPham(new ThemVaoGioHangRequest(1, 1, 4));

        assertEquals(6, existing.getSoluong());
        verify(chitietGioHangRepository, never()).save(any());
    }

    @Test
    void tinhTongTien_apDungKhoiLuongQuyDoiVaGiaHienHanh() {
        ChitietGioHang item = new ChitietGioHang();
        item.setIdchitietgiohang("ct-1");
        item.setIdgiohang(gioHang);
        item.setIdchitietcaban(sanPham);
        item.setIddonvitinh(donViTinh);
        item.setSoluong(2);

        Banggia bangGia = new Banggia();
        bangGia.setGiabanle(new BigDecimal("50000"));
        bangGia.setGiabansi(new BigDecimal("45000"));

        when(gioHangRepository.findByIdtaikhoan_IdtaikhoanAndTrangthai("kh-1", TrangThaiGioHang.DANG_HOAT_DONG))
                .thenReturn(Optional.of(gioHang));
        when(chitietGioHangRepository.findByIdgiohang_Idgiohang("gh-1")).thenReturn(List.of(item));
        when(banggiaRepository.findByChitietcabanAndNgayketthucIsNull(sanPham)).thenReturn(Optional.of(bangGia));

        BigDecimal tongTien = gioHangService.tinhTongTienGioHangHienTai("kh-1", false);

        assertEquals(0, new BigDecimal("120000.00").compareTo(tongTien));
    }

    @Test
    void capNhatSoLuongBangKhong_xoaDongGioHang() {
        ChitietGioHang item = new ChitietGioHang();
        item.setIdgiohang(gioHang);
        item.setSoluong(2);
        when(chitietGioHangRepository.findById("ct-1")).thenReturn(Optional.of(item));
        when(chitietGioHangRepository.findByIdgiohang_Idgiohang("gh-1")).thenReturn(List.of());

        gioHangService.capNhatSoLuong("ct-1", new CapNhatSoLuongRequest(0));

        verify(chitietGioHangRepository).delete(item);
    }

    @Test
    void themSanPhamKhongTonTai_nemLoiDungMa() {
        when(gioHangRepository.findByIdtaikhoan_IdtaikhoanAndTrangthai("kh-1", TrangThaiGioHang.DANG_HOAT_DONG))
                .thenReturn(Optional.of(gioHang));
        when(chitietcabanRepository.findById(999)).thenReturn(Optional.empty());

        AppExceptions exception = assertThrows(AppExceptions.class,
                () -> gioHangService.themSanPham(new ThemVaoGioHangRequest(999, 1, 1)));

        assertEquals(ErrorCode.CHITIET_CABAN_NOT_EXISTED, exception.getErrorCode());
        verifyNoInteractions(donvitinhRepository);
    }
}
