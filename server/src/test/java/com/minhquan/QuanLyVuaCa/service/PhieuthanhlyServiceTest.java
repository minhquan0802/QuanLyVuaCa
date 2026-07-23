package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietPhieuthanhlyRequest;
import com.minhquan.QuanLyVuaCa.dto.request.PhieuthanhlyRequest;
import com.minhquan.QuanLyVuaCa.dto.response.PhieuthanhlyResponse;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiCa;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhLy;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.ChitietphieuthanhlyMapper;
import com.minhquan.QuanLyVuaCa.mapper.PhieuthanhlyMapper;
import com.minhquan.QuanLyVuaCa.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
class PhieuthanhlyServiceTest {

    @Mock PhieuthanhlyRepository phieuthanhlyRepository;
    @Mock ChitietphieuthanhlyRepository chitietphieuthanhlyRepository;
    @Mock ChitietphieunhapRepository chitietphieunhapRepository;
    @Mock ChitietcabanRepository chitietcabanRepository;
    @Mock TaiKhoanRepository taiKhoanRepository;
    @Mock PhieuthanhlyMapper phieuthanhlyMapper;
    @Mock ChitietphieuthanhlyMapper chitietphieuthanhlyMapper;

    PhieuthanhlyService service;

    @BeforeEach
    void setUp() {
        service = new PhieuthanhlyService(phieuthanhlyRepository, chitietphieuthanhlyRepository,
                chitietphieunhapRepository, chitietcabanRepository, taiKhoanRepository,
                phieuthanhlyMapper, chitietphieuthanhlyMapper);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private ChitietPhieuthanhlyRequest chiTiet(String soLuong, String donGia) {
        return ChitietPhieuthanhlyRequest.builder()
                .idchitietphieunhap("lo-1")
                .soluongthanhly(soLuong == null ? null : new BigDecimal(soLuong))
                .dongia(donGia == null ? null : new BigDecimal(donGia))
                .build();
    }

    private PhieuthanhlyRequest request(String trangThai, ChitietPhieuthanhlyRequest... chiTiets) {
        return PhieuthanhlyRequest.builder()
                .lydothanhly("Cá không đạt chất lượng")
                .trangthai(trangThai)
                .listChiTiet(chiTiets == null ? null : List.of(chiTiets))
                .build();
    }

    private void assertLoi(ErrorCode expected, PhieuthanhlyRequest request) {
        AppExceptions exception = assertThrows(AppExceptions.class, () -> service.taoPhieuThanhly(request));
        assertEquals(expected, exception.getErrorCode());
        verifyNoInteractions(phieuthanhlyRepository, chitietphieunhapRepository, chitietcabanRepository);
    }

    @Test void danhSachRong_biTuChoiTruocKhiTaoPhieu() {
        assertLoi(ErrorCode.CHITIET_THANHLY_EMPTY, request("DA_TIEU_HUY"));
    }

    @Test void soLuongBangKhong_biTuChoi() {
        assertLoi(ErrorCode.SOLUONG_THANHLY_INVALID, request("DA_TIEU_HUY", chiTiet("0", "0")));
    }

    @Test void soLuongAm_biTuChoi() {
        assertLoi(ErrorCode.SOLUONG_THANHLY_INVALID, request("DA_TIEU_HUY", chiTiet("-1", "0")));
    }

    @Test void donGiaAm_biTuChoi() {
        assertLoi(ErrorCode.DONGIA_THANHLY_INVALID, request("DA_BAN_THANH_LY", chiTiet("1", "-1")));
    }

    @Test void banThanhLyDonGiaBangKhong_biTuChoi() {
        assertLoi(ErrorCode.DONGIA_THANHLY_INVALID, request("DA_BAN_THANH_LY", chiTiet("1", "0")));
    }

    @Test void tieuHuyDonGiaLonHonKhong_biTuChoi() {
        assertLoi(ErrorCode.DONGIA_THANHLY_INVALID, request("DA_TIEU_HUY", chiTiet("1", "1000")));
    }

    @Test void trangThaiKhongHopLe_biTuChoi() {
        assertLoi(ErrorCode.TRANGTHAI_THANHLY_INVALID, request("SAI_TRANG_THAI", chiTiet("1", "0")));
    }

    @Test
    void banThanhLyHopLe_truDungTonLoVaKho_tinhDungThanhTien() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin@vuaca.vn", null, List.of()));
        Taikhoan admin = Taikhoan.builder().idtaikhoan("admin-1").email("admin@vuaca.vn").build();
        when(taiKhoanRepository.findByEmail("admin@vuaca.vn")).thenReturn(Optional.of(admin));

        PhieuthanhlyRequest request = request("DA_BAN_THANH_LY", chiTiet("3.5", "20000"));
        Phieuthanhly phieu = new Phieuthanhly();
        phieu.setIdphieuthanhly("ptl-1");
        when(phieuthanhlyMapper.toEntity(request)).thenReturn(phieu);
        when(phieuthanhlyRepository.save(phieu)).thenReturn(phieu);

        Chitietcaban kho = Chitietcaban.builder().id(1).soluongton(new BigDecimal("10")).build();
        Chitietphieunhap lo = new Chitietphieunhap();
        lo.setIdchitietcaban(kho);
        lo.setSoluongconlai(new BigDecimal("8"));
        lo.setTrangthaica(TrangThaiCa.CON_HANG);
        when(chitietphieunhapRepository.findById("lo-1")).thenReturn(Optional.of(lo));

        Chitietphieuthanhly chiTietEntity = new Chitietphieuthanhly();
        when(chitietphieuthanhlyMapper.toEntity(any())).thenReturn(chiTietEntity);
        when(chitietphieuthanhlyRepository.findByIdphieuthanhly(phieu)).thenReturn(List.of());

        PhieuthanhlyResponse response = service.taoPhieuThanhly(request);

        assertNotNull(response);
        assertEquals(TrangThaiThanhLy.DA_BAN_THANH_LY, phieu.getTrangthai());
        assertEquals(0, new BigDecimal("4.5").compareTo(lo.getSoluongconlai()));
        assertEquals(0, new BigDecimal("6.5").compareTo(kho.getSoluongton()));
        assertEquals(0, new BigDecimal("70000.0").compareTo(chiTietEntity.getThanhtien()));
        verify(chitietphieunhapRepository).save(lo);
        verify(chitietcabanRepository).save(kho);
        verify(chitietphieuthanhlyRepository).save(chiTietEntity);
    }

    @Test
    void soLuongVuotTonLo_khongLuuChiTietVaKho() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin@vuaca.vn", null, List.of()));
        when(taiKhoanRepository.findByEmail("admin@vuaca.vn"))
                .thenReturn(Optional.of(Taikhoan.builder().email("admin@vuaca.vn").build()));
        PhieuthanhlyRequest request = request("DA_TIEU_HUY", chiTiet("9", "0"));
        Phieuthanhly phieu = new Phieuthanhly();
        when(phieuthanhlyMapper.toEntity(request)).thenReturn(phieu);
        when(phieuthanhlyRepository.save(phieu)).thenReturn(phieu);

        Chitietphieunhap lo = new Chitietphieunhap();
        lo.setSoluongconlai(new BigDecimal("8"));
        when(chitietphieunhapRepository.findById("lo-1")).thenReturn(Optional.of(lo));

        AppExceptions exception = assertThrows(AppExceptions.class, () -> service.taoPhieuThanhly(request));

        assertEquals(ErrorCode.SOLUONG_THANHLY_VUOT_QUA_TON_LO, exception.getErrorCode());
        verifyNoInteractions(chitietcabanRepository, chitietphieuthanhlyRepository);
    }
}
