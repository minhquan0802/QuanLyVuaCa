package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietDonhangRequest;
import com.minhquan.QuanLyVuaCa.dto.request.DonhangRequestCreation;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietDonhangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.DonhangResponse;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.DonhangMapper;
import com.minhquan.QuanLyVuaCa.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Test nghiệp vụ tạo/tra cứu/chuyển trạng thái đơn hàng: áp giá sỉ/lẻ theo vai trò khách hàng,
 * các luồng exception (thiếu dữ liệu, hết hàng, sai trạng thái, sai chủ đơn) và tính lại tổng tiền.
 * Phần đồng bộ kho/lô khi tạo đơn/đổi trạng thái đã được cover riêng ở DonhangServiceLoSyncTest.
 */
@ExtendWith(MockitoExtension.class)
class DonhangServiceTest {

    @Mock DonhangRepository donhangRepository;
    @Mock ChitietdonhangRepository chitietdonhangRepository;
    @Mock ChitietcabanRepository chitietcabanRepository;
    @Mock ChitietphieunhapRepository chitietphieunhapRepository;
    @Mock DonvitinhRepository donvitinhRepository;
    @Mock TaiKhoanRepository taikhoanRepository;
    @Mock DonhangMapper donhangMapper;
    @Mock CongNoService congNoService;
    @Mock BanggiaRepository banggiaRepository;
    @Mock ThongBaoService thongBaoService;

    DonhangService donhangService;

    @BeforeEach
    void setUp() {
        donhangService = new DonhangService(donhangRepository, chitietdonhangRepository, chitietcabanRepository,
                chitietphieunhapRepository, donvitinhRepository, taikhoanRepository, donhangMapper, congNoService,
                banggiaRepository, thongBaoService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Taikhoan dangNhap(String idtaikhoan, String email) {
        Taikhoan khach = Taikhoan.builder().idtaikhoan(idtaikhoan).ho("Nguyen").ten("A")
                .email(email).sodienthoai("0900000000").build();
        when(taikhoanRepository.findByEmail(email)).thenReturn(Optional.of(khach));

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(email);
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);
        return khach;
    }

    private Chitietcaban kho(BigDecimal soluongton) {
        Loaica loaica = new Loaica();
        loaica.setTenloaica("Cá điêu hồng");
        Sizeca sizeca = new Sizeca();
        sizeca.setSizeca("Size 1");
        return Chitietcaban.builder()
                .id(1)
                .idloaica(loaica)
                .idsizeca(sizeca)
                .soluongton(soluongton)
                .deleted(false)
                .build();
    }

    // ===== Tạo đơn: áp giá đúng theo vai trò khách hàng, khách vãng lai, và kiểm tra công nợ =====
    @Nested
    class TaoDonHang {

        private DonhangRequestCreation.DonhangRequestCreationBuilder requestCoSan() {
            return DonhangRequestCreation.builder()
                    .chiTietDonHang(List.of(ChitietDonhangRequest.builder()
                            .idchitietcaban("1")
                            .soluong(2)
                            .build()));
        }

        // Không mock quydoiRepository: đơn vị tính dùng thẳng hesokg = 1 (Kg) để cô lập việc test giá.
        private void mockChuoiTinhToanCoBan(Chitietcaban kho, DonhangRequestCreation request,
                                             BigDecimal giabanle, BigDecimal giabansi) {
            Donhang donhangEntity = new Donhang();
            when(donhangMapper.toDonhang(request)).thenReturn(donhangEntity);
            when(donhangRepository.save(any(Donhang.class))).thenAnswer(inv -> {
                Donhang d = inv.getArgument(0);
                d.setIddonhang("dh-12345678");
                return d;
            });

            Chitietdonhang ctdh = new Chitietdonhang();
            ctdh.setSoluong(2);
            when(donhangMapper.toChitietEntity(any())).thenReturn(ctdh);
            when(chitietcabanRepository.findById(1)).thenReturn(Optional.of(kho));

            Donvitinh dvt = new Donvitinh();
            dvt.setId(1);
            dvt.setHesokg(BigDecimal.ONE);
            when(donvitinhRepository.findById(1)).thenReturn(Optional.of(dvt));

            Banggia banggia = new Banggia();
            banggia.setGiabanle(giabanle);
            banggia.setGiabansi(giabansi);
            when(banggiaRepository.findByChitietcabanAndNgayketthucIsNull(kho)).thenReturn(Optional.of(banggia));
        }

        @Test
        void khachDaDangKy_ApDungGiaBanSi_VaGoiKiemTraCongNoTruocKhiLuu() {
            Chitietcaban kho = kho(BigDecimal.valueOf(100));
            Taikhoan khach = Taikhoan.builder().idtaikhoan("kh-1").vaitro("CUSTOMER").build();
            when(taikhoanRepository.findById("kh-1")).thenReturn(Optional.of(khach));

            DonhangRequestCreation request = requestCoSan().idthongtinkhachhang("kh-1").build();
            mockChuoiTinhToanCoBan(kho, request, BigDecimal.valueOf(50000), BigDecimal.valueOf(40000));
            when(donhangMapper.toDonhangResponse(any(), any(), any())).thenReturn(DonhangResponse.builder().build());

            donhangService.createDonhang(request);

            verify(congNoService).kiemTraDuocDatHang("kh-1", true);

            ArgumentCaptor<List<Chitietdonhang>> captor = ArgumentCaptor.forClass(List.class);
            verify(chitietdonhangRepository).saveAll(captor.capture());
            Chitietdonhang saved = captor.getValue().get(0);
            // 2 (soluong) * 1 (hesokg) * 40000 (giá sỉ) = 80000
            assertEquals(0, BigDecimal.valueOf(80000).compareTo(saved.getTongtienthucte()));
        }

        @Test
        void khachVangLai_ApDungGiaBanLe_KhongGoiKiemTraCongNo_TuDongDatTenMacDinh() {
            Chitietcaban kho = kho(BigDecimal.valueOf(100));
            DonhangRequestCreation request = requestCoSan().build(); // không có idthongtinkhachhang, không có tên
            mockChuoiTinhToanCoBan(kho, request, BigDecimal.valueOf(50000), BigDecimal.valueOf(40000));
            when(donhangMapper.toDonhangResponse(any(), any(), any())).thenReturn(DonhangResponse.builder().build());

            donhangService.createDonhang(request);

            verifyNoInteractions(congNoService);

            ArgumentCaptor<Donhang> captor = ArgumentCaptor.forClass(Donhang.class);
            verify(donhangRepository, times(2)).save(captor.capture());
            assertEquals("Khách vãng lai", captor.getAllValues().getLast().getTenKhachLe());

            ArgumentCaptor<List<Chitietdonhang>> chiTietCaptor = ArgumentCaptor.forClass(List.class);
            verify(chitietdonhangRepository).saveAll(chiTietCaptor.capture());
            // 2 (soluong) * 1 (hesokg) * 50000 (giá lẻ) = 100000
            assertEquals(0, BigDecimal.valueOf(100000).compareTo(chiTietCaptor.getValue().get(0).getTongtienthucte()));
        }

        @Test
        void thieuIdChitietCaban_NemException() {
            DonhangRequestCreation request = DonhangRequestCreation.builder()
                    .chiTietDonHang(List.of(ChitietDonhangRequest.builder().soluong(1).build()))
                    .build();
            when(donhangMapper.toDonhang(request)).thenReturn(new Donhang());
            when(donhangRepository.save(any(Donhang.class))).thenAnswer(inv -> {
                Donhang d = inv.getArgument(0);
                d.setIddonhang("dh-1");
                return d;
            });
            when(donhangMapper.toChitietEntity(any())).thenReturn(new Chitietdonhang());

            AppExceptions ex = assertThrows(AppExceptions.class, () -> donhangService.createDonhang(request));
            assertEquals(ErrorCode.THIEU_ID_CHITIET_CABAN, ex.getErrorCode());
        }

        @Test
        void chitietCabanKhongTonTai_NemException() {
            DonhangRequestCreation request = requestCoSan().build();
            when(donhangMapper.toDonhang(request)).thenReturn(new Donhang());
            when(donhangRepository.save(any(Donhang.class))).thenAnswer(inv -> {
                Donhang d = inv.getArgument(0);
                d.setIddonhang("dh-1");
                return d;
            });
            when(donhangMapper.toChitietEntity(any())).thenReturn(new Chitietdonhang());
            when(chitietcabanRepository.findById(1)).thenReturn(Optional.empty());

            AppExceptions ex = assertThrows(AppExceptions.class, () -> donhangService.createDonhang(request));
            assertEquals(ErrorCode.CHITIET_CABAN_NOT_EXISTED, ex.getErrorCode());
        }

        @Test
        void chuaCoBangGiaApDung_NemException() {
            Chitietcaban kho = kho(BigDecimal.valueOf(100));
            DonhangRequestCreation request = requestCoSan().build();
            when(donhangMapper.toDonhang(request)).thenReturn(new Donhang());
            when(donhangRepository.save(any(Donhang.class))).thenAnswer(inv -> {
                Donhang d = inv.getArgument(0);
                d.setIddonhang("dh-1");
                return d;
            });
            when(donhangMapper.toChitietEntity(any())).thenReturn(new Chitietdonhang());
            when(chitietcabanRepository.findById(1)).thenReturn(Optional.of(kho));

            Donvitinh dvt = new Donvitinh();
            dvt.setId(1);
            dvt.setHesokg(BigDecimal.ONE);
            when(donvitinhRepository.findById(1)).thenReturn(Optional.of(dvt));
            when(banggiaRepository.findByChitietcabanAndNgayketthucIsNull(kho)).thenReturn(Optional.empty());

            AppExceptions ex = assertThrows(AppExceptions.class, () -> donhangService.createDonhang(request));
            assertEquals(ErrorCode.BANGGIA_CHUA_AP_DUNG, ex.getErrorCode());
        }

        @Test
        void taoThangTrangThaiKhacChoXacNhan_TonKhoKhongDu_NemException() {
            Chitietcaban kho = kho(BigDecimal.valueOf(1)); // chỉ còn 1kg, cần 2kg
            DonhangRequestCreation request = requestCoSan()
                    .trangthaidonhang(TrangThaiDonHang.GIAO_HANG_THANH_CONG)
                    .build();
            mockChuoiTinhToanCoBan(kho, request, BigDecimal.valueOf(50000), BigDecimal.valueOf(40000));

            AppExceptions ex = assertThrows(AppExceptions.class, () -> donhangService.createDonhang(request));
            assertEquals(ErrorCode.INVENTORY_NOT_ENOUGH, ex.getErrorCode());
        }
    }

    // ===== Tra cứu đơn hàng =====
    @Nested
    class TraCuuDonHang {

        @Test
        void getDonhangById_KhongTonTai_NemException() {
            when(donhangRepository.findById("dh-x")).thenReturn(Optional.empty());

            AppExceptions ex = assertThrows(AppExceptions.class, () -> donhangService.getDonhangById("dh-x"));
            assertEquals(ErrorCode.DONHANG_NOT_EXISTED, ex.getErrorCode());
        }

        @Test
        void getChiTietDonHang_DonKhongTonTai_NemException() {
            when(donhangRepository.findById("dh-x")).thenReturn(Optional.empty());

            AppExceptions ex = assertThrows(AppExceptions.class, () -> donhangService.getChiTietDonHang("dh-x"));
            assertEquals(ErrorCode.DONHANG_NOT_EXISTED, ex.getErrorCode());
        }

        @Test
        void getChiTietDonHang_TraVeDanhSachKemTongKgDangChoCuaDonKhac() {
            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

            Chitietcaban kho = kho(BigDecimal.valueOf(10));
            Chitietdonhang ctdh = new Chitietdonhang();
            ctdh.setIdchitietcaban(kho);
            when(chitietdonhangRepository.findByIddonhang(donhang)).thenReturn(List.of(ctdh));

            ChitietDonhangResponse response = ChitietDonhangResponse.builder().build();
            when(donhangMapper.toChitietResponse(ctdh)).thenReturn(response);
            when(chitietdonhangRepository.tongKgDangChoKhac(eq(kho), any(), eq("dh-1")))
                    .thenReturn(BigDecimal.valueOf(7));

            List<ChitietDonhangResponse> result = donhangService.getChiTietDonHang("dh-1");

            assertEquals(1, result.size());
            assertEquals(BigDecimal.valueOf(7), result.get(0).getTongKgDonKhacDangCho());
        }
    }

    // ===== Khách hàng tự xác nhận đã nhận hàng =====
    @Nested
    class XacNhanNhanHang {

        @Test
        void saiTrangThai_NemException() {
            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setTrangthaidonhang(TrangThaiDonHang.CHO_XAC_NHAN);
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

            AppExceptions ex = assertThrows(AppExceptions.class, () -> donhangService.xacNhanNhanHang("dh-1"));
            assertEquals(ErrorCode.ORDER_STATUS_INVALID, ex.getErrorCode());
        }

        @Test
        void khongPhaiChuDon_NemAccessDenied() {
            dangNhap("kh-1", "khach@vuaca.vn");

            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setIdthongtinkhachhang("kh-KHAC");
            donhang.setTrangthaidonhang(TrangThaiDonHang.DANG_VAN_CHUYEN);
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

            AppExceptions ex = assertThrows(AppExceptions.class, () -> donhangService.xacNhanNhanHang("dh-1"));
            assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
        }

        @Test
        void thanhCong_ChuyenGiaoHangThanhCong_VaGoiCongNoXuLyDonGiaoThanhCong() {
            Taikhoan khach = dangNhap("kh-1", "khach@vuaca.vn");

            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setIdthongtinkhachhang("kh-1");
            donhang.setTongtien(BigDecimal.valueOf(80000));
            donhang.setTrangthaidonhang(TrangThaiDonHang.DANG_VAN_CHUYEN);
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));
            when(donhangRepository.save(donhang)).thenReturn(donhang);
            when(donhangMapper.toDonhangResponse(any(), any(), any())).thenReturn(DonhangResponse.builder().build());

            donhangService.xacNhanNhanHang("dh-1");

            assertEquals(TrangThaiDonHang.GIAO_HANG_THANH_CONG, donhang.getTrangthaidonhang());
            verify(congNoService).xuLyDonGiaoThanhCong(eq(donhang), any(BigDecimal.class));
        }
    }

    // ===== Khách hàng tự hủy đơn khi còn chờ xác nhận =====
    @Nested
    class HuyDonHang {

        @Test
        void saiTrangThai_NemException() {
            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setTrangthaidonhang(TrangThaiDonHang.DANG_DONG_HANG);
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

            AppExceptions ex = assertThrows(AppExceptions.class, () -> donhangService.huyDonHang("dh-1"));
            assertEquals(ErrorCode.ORDER_STATUS_INVALID, ex.getErrorCode());
        }

        @Test
        void khongPhaiChuDon_NemAccessDenied() {
            dangNhap("kh-1", "khach@vuaca.vn");

            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setIdthongtinkhachhang("kh-KHAC");
            donhang.setTrangthaidonhang(TrangThaiDonHang.CHO_XAC_NHAN);
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

            AppExceptions ex = assertThrows(AppExceptions.class, () -> donhangService.huyDonHang("dh-1"));
            assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
        }
    }

    // ===== Admin/staff cập nhật trạng thái: chỉ báo công nợ đúng 1 lần khi ĐẦU TIÊN vào GIAO_HANG_THANH_CONG =====
    @Nested
    class CapNhatTrangThai {

        @Test
        void chuyenSangGiaoHangThanhCong_GoiCongNoXuLyDonGiaoThanhCong() {
            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setTongtien(BigDecimal.valueOf(80000));
            donhang.setTrangthaidonhang(TrangThaiDonHang.DANG_VAN_CHUYEN);
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));
            when(donhangRepository.save(donhang)).thenReturn(donhang);
            when(donhangMapper.toDonhangResponse(any(), any(), any())).thenReturn(DonhangResponse.builder().build());

            donhangService.updateStatus("dh-1", TrangThaiDonHang.GIAO_HANG_THANH_CONG);

            verify(congNoService).xuLyDonGiaoThanhCong(eq(donhang), any(BigDecimal.class));
        }

        @Test
        void daGiaoHangThanhCongRoi_KhongGoiLaiCongNo() {
            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setTrangthaidonhang(TrangThaiDonHang.GIAO_HANG_THANH_CONG);
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));
            when(donhangRepository.save(donhang)).thenReturn(donhang);
            when(donhangMapper.toDonhangResponse(any(), any(), any())).thenReturn(DonhangResponse.builder().build());

            donhangService.updateStatus("dh-1", TrangThaiDonHang.GIAO_HANG_THANH_CONG);

            verifyNoInteractions(congNoService);
        }
    }

    // ===== Tính tổng tiền đơn hàng: ưu tiên dữ liệu đã lưu, fallback tính lại on-the-fly =====
    @Nested
    class TinhTongTienDonHang {

        @Test
        void coSanTongTienDonHang_traVeGiaTriDaLuu() {
            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setTongtien(BigDecimal.valueOf(80000));
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

            BigDecimal tong = donhangService.tinhTongTienDonHang("dh-1");

            assertEquals(0, BigDecimal.valueOf(80000).compareTo(tong));
            verifyNoInteractions(chitietdonhangRepository, banggiaRepository);
        }

        @Test
        void tongTienBangKhong_traVeDungGiaTriDaLuu() {
            Donhang donhang = new Donhang();
            donhang.setIddonhang("dh-1");
            donhang.setTongtien(BigDecimal.ZERO);
            when(donhangRepository.findById("dh-1")).thenReturn(Optional.of(donhang));

            BigDecimal tong = donhangService.tinhTongTienDonHang("dh-1");

            assertEquals(0, BigDecimal.ZERO.compareTo(tong));
            verifyNoInteractions(chitietdonhangRepository, banggiaRepository);
        }
    }
}
