package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietPhieunhapRequest;
import com.minhquan.QuanLyVuaCa.dto.request.PhieunhapRequest;
import com.minhquan.QuanLyVuaCa.dto.response.PhieunhapResponse;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiCa;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToan;
import com.minhquan.QuanLyVuaCa.mapper.ChitietphieunhapMapper;
import com.minhquan.QuanLyVuaCa.mapper.PhieunhapMapper;
import com.minhquan.QuanLyVuaCa.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PhieunhapServiceTest {

    @Mock PhieunhapRepository phieunhapRepository;
    @Mock ChitietphieunhapRepository chitietphieunhapRepository;
    @Mock ChitietcabanRepository chitietcabanRepository;
    @Mock NhacungcapRepository nhacungcapRepository;
    @Mock LoaicaRepository loaicaRepository;
    @Mock SizecaRepository sizecaRepository;
    @Mock TaiKhoanRepository taiKhoanRepository;
    @Mock PhieunhapMapper phieunhapMapper;
    @Mock ChitietphieunhapMapper chitietphieunhapMapper;
    @Mock BanggiaRepository banggiaRepository;

    PhieunhapService phieunhapService;
    Loaica loaiCa;
    Sizeca sizeCa;
    Nhacungcap nhaCungCap;

    @BeforeEach
    void setUp() {
        phieunhapService = new PhieunhapService(phieunhapRepository, chitietphieunhapRepository,
                chitietcabanRepository, nhacungcapRepository, loaicaRepository, sizecaRepository,
                taiKhoanRepository, phieunhapMapper, chitietphieunhapMapper, banggiaRepository);

        loaiCa = new Loaica();
        loaiCa.setId(1);
        sizeCa = new Sizeca();
        sizeCa.setId(2);
        nhaCungCap = new Nhacungcap();
        nhaCungCap.setId(3);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private PhieunhapRequest request(BigDecimal soLuong, String trangThaiThanhToan) {
        return PhieunhapRequest.builder()
                .idloaica(1)
                .idncc(3)
                .ngaynhap(LocalDate.of(2026, 7, 23))
                .trangthaithanhtoan(trangThaiThanhToan)
                .listChiTiet(List.of(ChitietPhieunhapRequest.builder()
                        .idsizeca(2)
                        .soluongnhap(soLuong)
                        .gianhap(new BigDecimal("30000"))
                        .build()))
                .build();
    }

    private void mockDuLieuChung(PhieunhapRequest request) {
        Phieunhap phieu = new Phieunhap();
        when(phieunhapMapper.toEntity(request)).thenReturn(phieu);
        when(phieunhapRepository.save(phieu)).thenAnswer(invocation -> invocation.getArgument(0));
        when(nhacungcapRepository.findById(3)).thenReturn(Optional.of(nhaCungCap));
        when(loaicaRepository.findById(1)).thenReturn(Optional.of(loaiCa));
        when(sizecaRepository.findById(2)).thenReturn(Optional.of(sizeCa));
        when(chitietphieunhapMapper.toEntity(any())).thenReturn(new Chitietphieunhap());
        when(phieunhapMapper.toResponse(phieu)).thenReturn(PhieunhapResponse.builder().build());
    }

    @Test
    void nhapVaoSanPhamDaCo_congDonKhoVaTaoLoConHang() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "admin@vuaca.vn", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        PhieunhapRequest request = request(new BigDecimal("10.50"), "DA_THANH_TOAN");
        mockDuLieuChung(request);

        Chitietcaban kho = Chitietcaban.builder()
                .id(10).idloaica(loaiCa).idsizeca(sizeCa)
                .soluongton(new BigDecimal("4.50")).build();
        when(chitietcabanRepository.findByIdloaicaAndIdsizeca(loaiCa, sizeCa)).thenReturn(Optional.of(kho));
        when(chitietcabanRepository.save(kho)).thenReturn(kho);

        phieunhapService.nhapHang(request);

        assertEquals(0, new BigDecimal("15.00").compareTo(kho.getSoluongton()));
        ArgumentCaptor<List<Chitietphieunhap>> captor = ArgumentCaptor.forClass(List.class);
        verify(chitietphieunhapRepository).saveAll(captor.capture());
        Chitietphieunhap loMoi = captor.getValue().getFirst();
        assertEquals(0, new BigDecimal("10.50").compareTo(loMoi.getSoluongconlai()));
        assertEquals(TrangThaiCa.CON_HANG, loMoi.getTrangthaica());
        assertEquals(LocalDate.of(2026, 7, 25), loMoi.getNgaythanhly());
    }

    @Test
    void staffGuiDaThanhToan_backendVanBatBuocChuaThanhToan() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "staff@vuaca.vn", null, List.of(new SimpleGrantedAuthority("ROLE_STAFF"))));
        PhieunhapRequest request = request(new BigDecimal("5"), "DA_THANH_TOAN");
        mockDuLieuChung(request);

        when(chitietcabanRepository.findByIdloaicaAndIdsizeca(loaiCa, sizeCa)).thenReturn(Optional.empty());
        when(chitietcabanRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        phieunhapService.nhapHang(request);

        ArgumentCaptor<Phieunhap> captor = ArgumentCaptor.forClass(Phieunhap.class);
        verify(phieunhapRepository).save(captor.capture());
        assertEquals(TrangThaiThanhToan.CHUA_THANH_TOAN, captor.getValue().getTrangthaithanhtoan());
    }

    @Test
    void nhapBienTheMoi_taoKhoVoiDungSoLuongBanDau() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "admin@vuaca.vn", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        PhieunhapRequest request = request(new BigDecimal("7.25"), "CHUA_THANH_TOAN");
        mockDuLieuChung(request);
        when(chitietcabanRepository.findByIdloaicaAndIdsizeca(loaiCa, sizeCa)).thenReturn(Optional.empty());
        when(chitietcabanRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        phieunhapService.nhapHang(request);

        verify(chitietcabanRepository).save(argThat(kho ->
                kho.getIdloaica() == loaiCa
                        && kho.getIdsizeca() == sizeCa
                        && kho.getSoluongton().compareTo(new BigDecimal("7.25")) == 0));
    }
}
