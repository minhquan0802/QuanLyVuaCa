package com.minhquan.QuanLyVuaCa.service;

import com.cloudinary.Cloudinary;
import com.minhquan.QuanLyVuaCa.dto.request.BanggiaRequest;
import com.minhquan.QuanLyVuaCa.dto.request.CauHinhKichThuocVaGiaRequest;
import com.minhquan.QuanLyVuaCa.dto.request.ChitietCabanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaoLoaiCaHoanChinhRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietCabanResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LoaicaResponse;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.LoaicaMapper;
import com.minhquan.QuanLyVuaCa.repository.BanggiaRepository;
import com.minhquan.QuanLyVuaCa.repository.ChitietcabanRepository;
import com.minhquan.QuanLyVuaCa.repository.LoaicaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoaicaServiceHoanChinhTest {

    @Mock LoaicaRepository loaicaRepository;
    @Mock LoaicaMapper loaicaMapper;
    @Mock ChitietcabanRepository chitietcabanRepository;
    @Mock BanggiaRepository banggiaRepository;
    @Mock Cloudinary cloudinary;
    @Mock SizecaService sizecaService;
    @Mock ChitietCabanService chitietCabanService;
    @Mock BanggiaService banggiaService;

    LoaicaService service;

    @BeforeEach
    void setUp() {
        service = new LoaicaService(
                loaicaRepository,
                loaicaMapper,
                chitietcabanRepository,
                banggiaRepository,
                cloudinary,
                sizecaService,
                chitietCabanService,
                banggiaService);
    }

    @Test
    void taoLoaiCaKemKichCoVaBangGiaTrongCungLuotXuLy() {
        LoaicaResponse loaiCa = LoaicaResponse.builder()
                .id(13)
                .tenloaica("Cá Trê")
                .build();
        ChitietCabanResponse chiTiet = ChitietCabanResponse.builder()
                .id(101)
                .build();
        TaoLoaiCaHoanChinhRequest request = requestVoiMotSize();

        mockTaoLoaiCa(loaiCa);
        when(chitietCabanService.taoMoi(any())).thenReturn(chiTiet);

        LoaicaResponse actual = service.taoLoaiCaHoanChinh(request, null);

        assertEquals(loaiCa, actual);

        ArgumentCaptor<ChitietCabanCreationRequest> chiTietCaptor =
                ArgumentCaptor.forClass(ChitietCabanCreationRequest.class);
        verify(chitietCabanService).taoMoi(chiTietCaptor.capture());
        assertEquals(13, chiTietCaptor.getValue().getIdloaica());
        assertEquals(4, chiTietCaptor.getValue().getIdsizeca());
        assertEquals(BigDecimal.ZERO, chiTietCaptor.getValue().getSoluongton());

        ArgumentCaptor<BanggiaRequest> bangGiaCaptor =
                ArgumentCaptor.forClass(BanggiaRequest.class);
        verify(banggiaService).taoMoi(bangGiaCaptor.capture());
        assertEquals(101, bangGiaCaptor.getValue().getIdchitietcaban());
        assertEquals(new BigDecimal("65000"), bangGiaCaptor.getValue().getGiabanle());
        assertEquals(new BigDecimal("60000"), bangGiaCaptor.getValue().getGiabansi());
        verify(sizecaService, never()).taoSize(any());
    }

    @Test
    void loiBangGiaThiNemLoiDeTransactionRollback() {
        LoaicaResponse loaiCa = LoaicaResponse.builder()
                .id(13)
                .build();
        ChitietCabanResponse chiTiet = ChitietCabanResponse.builder()
                .id(101)
                .build();

        mockTaoLoaiCa(loaiCa);
        when(chitietCabanService.taoMoi(any())).thenReturn(chiTiet);
        when(banggiaService.taoMoi(any()))
                .thenThrow(new AppExceptions(ErrorCode.GIABANLE_INVALID));

        AppExceptions exception = assertThrows(
                AppExceptions.class,
                () -> service.taoLoaiCaHoanChinh(requestVoiMotSize(), null));

        assertEquals(ErrorCode.GIABANLE_INVALID, exception.getErrorCode());
    }

    private void mockTaoLoaiCa(LoaicaResponse response) {
        when(loaicaRepository.existsByTenloaicaIgnoreCase("Cá Trê")).thenReturn(false);
        when(loaicaMapper.toLoaica(any(TaoLoaiCaHoanChinhRequest.class)))
                .thenAnswer(invocation -> {
                    TaoLoaiCaHoanChinhRequest request = invocation.getArgument(0);
                    Loaica entity = new Loaica();
                    entity.setTenloaica(request.getTenloaica());
                    entity.setMieuta(request.getMieuta());
                    return entity;
                });
        when(loaicaRepository.saveAndFlush(any(Loaica.class))).thenAnswer(invocation -> {
            Loaica entity = invocation.getArgument(0);
            entity.setId(13);
            return entity;
        });
        when(loaicaMapper.toLoaicaResponse(any(Loaica.class))).thenReturn(response);
    }

    private TaoLoaiCaHoanChinhRequest requestVoiMotSize() {
        return TaoLoaiCaHoanChinhRequest.builder()
                .tenloaica("Cá Trê")
                .mieuta("Cá da trơn")
                .cauhinhkichthuoc(List.of(
                        CauHinhKichThuocVaGiaRequest.builder()
                                .idsizeca(4)
                                .sokgtuongung(new BigDecimal("1.50"))
                                .giabanle(new BigDecimal("65000"))
                                .giabansi(new BigDecimal("60000"))
                                .build()))
                .build();
    }
}
