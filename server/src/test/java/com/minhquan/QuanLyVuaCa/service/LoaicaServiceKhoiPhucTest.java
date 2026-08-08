package com.minhquan.QuanLyVuaCa.service;

import com.cloudinary.Cloudinary;
import com.minhquan.QuanLyVuaCa.dto.request.BanggiaRequest;
import com.minhquan.QuanLyVuaCa.dto.request.CauHinhKichThuocVaGiaRequest;
import com.minhquan.QuanLyVuaCa.dto.request.ChitietCabanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.MoLaiLoaiCaRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietCabanResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LoaicaResponse;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoaicaServiceKhoiPhucTest {

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
    void chiKhoiPhucSizeDuocGuiLenVaTaoGiaTrongCungLuotXuLy() {
        Loaica loaiCa = new Loaica();
        loaiCa.setId(3);
        loaiCa.setDeleted(true);

        Chitietcaban sizeCuThuNhat = new Chitietcaban();
        sizeCuThuNhat.setDeleted(false);
        Chitietcaban sizeCuThuHai = new Chitietcaban();
        sizeCuThuHai.setDeleted(false);

        when(loaicaRepository.findById(3)).thenReturn(Optional.of(loaiCa));
        when(chitietcabanRepository.findByIdloaica(loaiCa))
                .thenReturn(List.of(sizeCuThuNhat, sizeCuThuHai));
        when(banggiaRepository.findByChitietcabanInAndNgayketthucIsNull(any()))
                .thenReturn(List.of());
        when(chitietCabanService.taoMoi(any()))
                .thenReturn(ChitietCabanResponse.builder().id(101).build());
        when(loaicaRepository.save(loaiCa)).thenReturn(loaiCa);

        LoaicaResponse response = LoaicaResponse.builder().id(3).deleted(false).build();
        when(loaicaMapper.toLoaicaResponse(loaiCa)).thenReturn(response);

        MoLaiLoaiCaRequest request = MoLaiLoaiCaRequest.builder()
                .cauhinhkichthuoc(List.of(
                        CauHinhKichThuocVaGiaRequest.builder()
                                .idsizeca(4)
                                .sokgtuongung(new BigDecimal("1.5"))
                                .giabanle(new BigDecimal("65000"))
                                .giabansi(new BigDecimal("60000"))
                                .build()))
                .build();

        assertEquals(response, service.khoiPhucLoaica(3, request));
        assertTrue(sizeCuThuNhat.getDeleted());
        assertTrue(sizeCuThuHai.getDeleted());

        ArgumentCaptor<ChitietCabanCreationRequest> chiTietCaptor =
                ArgumentCaptor.forClass(ChitietCabanCreationRequest.class);
        verify(chitietCabanService).taoMoi(chiTietCaptor.capture());
        assertEquals(4, chiTietCaptor.getValue().getIdsizeca());
        assertEquals(new BigDecimal("1.5"), chiTietCaptor.getValue().getSokgtuongung());

        ArgumentCaptor<BanggiaRequest> bangGiaCaptor =
                ArgumentCaptor.forClass(BanggiaRequest.class);
        verify(banggiaService).taoMoi(bangGiaCaptor.capture());
        assertEquals(101, bangGiaCaptor.getValue().getIdchitietcaban());
        assertEquals(new BigDecimal("65000"), bangGiaCaptor.getValue().getGiabanle());
        assertEquals(new BigDecimal("60000"), bangGiaCaptor.getValue().getGiabansi());
        assertEquals(false, loaiCa.getDeleted());
    }
}
