package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietPhieuthanhlyRequest;
import com.minhquan.QuanLyVuaCa.dto.request.PhieuthanhlyRequest;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiCa;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
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
import org.springframework.data.jpa.repository.Lock;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.Instant;
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
    Taikhoan admin;

    @BeforeEach
    void setUp() {
        service = new PhieuthanhlyService(phieuthanhlyRepository, chitietphieuthanhlyRepository,
                chitietphieunhapRepository, chitietcabanRepository, taiKhoanRepository,
                phieuthanhlyMapper, chitietphieuthanhlyMapper);

        admin = Taikhoan.builder().idtaikhoan("ADMIN-1").email("admin@vuaca.vn")
                .ho("Quản").ten("Trị").vaitro("ADMIN").build();
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getName()).thenReturn(admin.getEmail());
        SecurityContext context = mock(SecurityContext.class);
        lenient().when(context.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(context);

        lenient().when(taiKhoanRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
        lenient().when(phieuthanhlyMapper.toEntity(any())).thenAnswer(invocation -> {
            PhieuthanhlyRequest request = invocation.getArgument(0);
            Phieuthanhly phieu = new Phieuthanhly();
            phieu.setLydothanhly(request.getLydothanhly());
            phieu.setGhichu(request.getGhichu());
            return phieu;
        });
        lenient().when(phieuthanhlyRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(chitietphieuthanhlyMapper.toEntity(any())).thenAnswer(invocation -> {
            ChitietPhieuthanhlyRequest request = invocation.getArgument(0);
            Chitietphieuthanhly detail = new Chitietphieuthanhly();
            detail.setSoluongthanhly(request.getSoluongthanhly());
            detail.setDongia(request.getDongia());
            return detail;
        });
        lenient().when(chitietphieuthanhlyRepository.findByIdphieuthanhly(any())).thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Chitietphieunhap lot(String id, BigDecimal remaining, BigDecimal inventory) {
        Chitietcaban stock = new Chitietcaban();
        stock.setSoluongton(inventory);
        Chitietphieunhap lot = new Chitietphieunhap();
        lot.setIdchitietphieunhap(id);
        lot.setSoluongconlai(remaining);
        lot.setTrangthaica(TrangThaiCa.CON_HANG);
        lot.setIdchitietcaban(stock);
        return lot;
    }

    private ChitietPhieuthanhlyRequest detail(String lotId, String quantity, String price) {
        return ChitietPhieuthanhlyRequest.builder()
                .idchitietphieunhap(lotId)
                .soluongthanhly(new BigDecimal(quantity))
                .dongia(new BigDecimal(price))
                .build();
    }

    private PhieuthanhlyRequest request(String status, ChitietPhieuthanhlyRequest... details) {
        return PhieuthanhlyRequest.builder()
                .lydothanhly("Hàng không đạt chất lượng")
                .ghichu("Biên bản kiểm tra")
                .trangthai(status)
                .listChiTiet(List.of(details))
                .build();
    }

    private void mockLot(Chitietphieunhap lot) {
        when(chitietphieunhapRepository.findById(lot.getIdchitietphieunhap())).thenReturn(Optional.of(lot));
    }

    @Test
    void test67_ghiNhanDungNguoiDangNhapVaThoiGianLap() {
        Chitietphieunhap lot = lot("LOT-1", BigDecimal.TEN, BigDecimal.valueOf(20));
        mockLot(lot);
        Instant before = Instant.now();

        service.taoPhieuThanhly(request("DA_TIEU_HUY", detail("LOT-1", "2", "0")));

        ArgumentCaptor<Phieuthanhly> captor = ArgumentCaptor.forClass(Phieuthanhly.class);
        verify(phieuthanhlyRepository).save(captor.capture());
        assertSame(admin, captor.getValue().getIdnguoitaophieu());
        assertFalse(captor.getValue().getNgaythanhly().isBefore(before));
    }

    @Test
    void test68_loKhongTonTaiKhongTaoChiTietThanhLy() {
        when(chitietphieunhapRepository.findById("NOT-FOUND")).thenReturn(Optional.empty());
        assertThrows(AppExceptions.class,
                () -> service.taoPhieuThanhly(request("DA_TIEU_HUY", detail("NOT-FOUND", "2", "0"))));
        verify(chitietphieuthanhlyRepository, never()).save(any());
    }

    @Test
    void test69_truDungSoLuongConLaiCuaLo() {
        Chitietphieunhap lot = lot("LOT-1", BigDecimal.TEN, BigDecimal.valueOf(20));
        mockLot(lot);
        service.taoPhieuThanhly(request("DA_TIEU_HUY", detail("LOT-1", "2.5", "0")));
        assertEquals(0, new BigDecimal("7.5").compareTo(lot.getSoluongconlai()));
    }

    @Test
    void test70_thanhLyHetLoChuyenTrangThaiThanhLy() {
        Chitietphieunhap lot = lot("LOT-1", BigDecimal.TEN, BigDecimal.valueOf(20));
        mockLot(lot);
        service.taoPhieuThanhly(request("DA_TIEU_HUY", detail("LOT-1", "10", "0")));
        assertEquals(BigDecimal.ZERO, lot.getSoluongconlai());
        assertEquals(TrangThaiCa.THANH_LY, lot.getTrangthaica());
    }

    @Test
    void test71_thanhLyMotPhanGiuTrangThaiConHang() {
        Chitietphieunhap lot = lot("LOT-1", BigDecimal.TEN, BigDecimal.valueOf(20));
        mockLot(lot);
        service.taoPhieuThanhly(request("DA_TIEU_HUY", detail("LOT-1", "2", "0")));
        assertEquals(TrangThaiCa.CON_HANG, lot.getTrangthaica());
    }

    @Test
    void test72_truDungTonKhoTong() {
        Chitietphieunhap lot = lot("LOT-1", BigDecimal.TEN, BigDecimal.valueOf(20));
        mockLot(lot);
        service.taoPhieuThanhly(request("DA_TIEU_HUY", detail("LOT-1", "3", "0")));
        assertEquals(0, BigDecimal.valueOf(17).compareTo(lot.getIdchitietcaban().getSoluongton()));
    }

    @Test
    void test73_tonKhoTongKhongBiAm() {
        Chitietphieunhap lot = lot("LOT-1", BigDecimal.TEN, BigDecimal.ONE);
        mockLot(lot);
        service.taoPhieuThanhly(request("DA_TIEU_HUY", detail("LOT-1", "5", "0")));
        assertEquals(BigDecimal.ZERO, lot.getIdchitietcaban().getSoluongton());
    }

    @Test
    void test74_luuDungThanhTienChiTiet() {
        Chitietphieunhap lot = lot("LOT-1", BigDecimal.TEN, BigDecimal.valueOf(20));
        mockLot(lot);
        service.taoPhieuThanhly(request("DA_BAN_THANH_LY", detail("LOT-1", "2.5", "40000")));
        ArgumentCaptor<Chitietphieuthanhly> captor = ArgumentCaptor.forClass(Chitietphieuthanhly.class);
        verify(chitietphieuthanhlyRepository).save(captor.capture());
        assertEquals(0, BigDecimal.valueOf(100_000).compareTo(captor.getValue().getThanhtien()));
    }

    @Test
    void test75_nhieuLoXuLyTrongMotGiaoDichCoRollbackKhiMotDongLoi() throws Exception {
        Chitietphieunhap lot = lot("LOT-1", BigDecimal.TEN, BigDecimal.valueOf(20));
        mockLot(lot);
        when(chitietphieunhapRepository.findById("NOT-FOUND")).thenReturn(Optional.empty());
        assertThrows(AppExceptions.class, () -> service.taoPhieuThanhly(request("DA_TIEU_HUY",
                detail("LOT-1", "2", "0"), detail("NOT-FOUND", "1", "0"))));
        Method method = PhieuthanhlyService.class.getMethod("taoPhieuThanhly", PhieuthanhlyRequest.class);
        assertNotNull(method.getAnnotation(Transactional.class));
    }

    @Test
    void test76_khoaLoKhiHaiYeuCauThanhLyDongThoi() throws Exception {
        Method findById = ChitietphieunhapRepository.class.getMethod("findById", Object.class);
        assertNotNull(findById.getAnnotation(Lock.class),
                "Truy vấn lô phải có khóa ghi để hai yêu cầu không cùng sử dụng một số dư tồn");
    }

    @Test
    void test77_tuChoiDanhSachChiTietRong() {
        assertThrows(AppExceptions.class,
                () -> service.taoPhieuThanhly(request("DA_TIEU_HUY")));
    }

    @Test
    void test78_tuChoiSoLuongBangKhongHoacAm() {
        Chitietphieunhap lotZero = lot("LOT-0", BigDecimal.TEN, BigDecimal.valueOf(20));
        Chitietphieunhap lotNegative = lot("LOT-N", BigDecimal.TEN, BigDecimal.valueOf(20));
        mockLot(lotZero);
        mockLot(lotNegative);
        assertAll(
                () -> assertThrows(AppExceptions.class,
                        () -> service.taoPhieuThanhly(request("DA_TIEU_HUY", detail("LOT-0", "0", "0")))),
                () -> assertThrows(AppExceptions.class,
                        () -> service.taoPhieuThanhly(request("DA_TIEU_HUY", detail("LOT-N", "-1", "0"))))
        );
    }

    @Test
    void test79_tuChoiDonGiaAm() {
        Chitietphieunhap lot = lot("LOT-1", BigDecimal.TEN, BigDecimal.valueOf(20));
        mockLot(lot);
        assertThrows(AppExceptions.class,
                () -> service.taoPhieuThanhly(request("DA_BAN_THANH_LY", detail("LOT-1", "1", "-1"))));
    }

    @Test
    void test80_tuChoiTrangThaiThanhLyKhongHopLe() {
        Chitietphieunhap lot = lot("LOT-1", BigDecimal.TEN, BigDecimal.valueOf(20));
        mockLot(lot);
        assertThrows(AppExceptions.class,
                () -> service.taoPhieuThanhly(request("TRANG_THAI_SAI", detail("LOT-1", "1", "0"))));
    }
}
