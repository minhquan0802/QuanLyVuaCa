package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietCabanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietCabanResponse;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.entity.Sizeca;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.ChitietCabanMapper;
import com.minhquan.QuanLyVuaCa.repository.BanggiaRepository;
import com.minhquan.QuanLyVuaCa.repository.ChitietcabanRepository;
import com.minhquan.QuanLyVuaCa.repository.ChitietphieunhapRepository;
import com.minhquan.QuanLyVuaCa.repository.LoaicaRepository;
import com.minhquan.QuanLyVuaCa.repository.SizecaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChitietCabanServiceTest {

    @Mock ChitietcabanRepository chitietcabanRepository;
    @Mock ChitietphieunhapRepository chitietphieunhapRepository;
    @Mock LoaicaRepository loaicaRepository;
    @Mock SizecaRepository sizecaRepository;
    @Mock ChitietCabanMapper chitietCabanMapper;
    @Mock BanggiaRepository banggiaRepository;

    ChitietCabanService service;
    Loaica loaiCa;

    @BeforeEach
    void setUp() {
        service = new ChitietCabanService(
                chitietcabanRepository,
                chitietphieunhapRepository,
                loaicaRepository,
                sizecaRepository,
                chitietCabanMapper,
                banggiaRepository);

        loaiCa = new Loaica();
        loaiCa.setId(3);
        loaiCa.setTenloaica("Cá Chép");
    }

    @Test
    void khoiPhucCauHinhCuTraVeDtoKhongCanMapperLazy() {
        when(loaicaRepository.findById(3)).thenReturn(Optional.of(loaiCa));
        Sizeca size = size(4, "Size Nhì (Vừa)");
        Chitietcaban deletedRecord = deletedRecord(109, size);
        ChitietCabanCreationRequest request = request(4);

        when(sizecaRepository.findById(4)).thenReturn(Optional.of(size));
        when(chitietcabanRepository.findByIdloaicaAndIdsizeca(loaiCa, size))
                .thenReturn(Optional.of(deletedRecord));
        when(chitietcabanRepository.save(deletedRecord)).thenReturn(deletedRecord);

        ChitietCabanResponse response = service.taoMoi(request);

        assertEquals(109, response.getId());
        assertEquals(3, response.getIdLoaiCa());
        assertEquals(4, response.getIdSizeCa());
        assertEquals(new BigDecimal("2.50"), response.getSokgtuongung());
        verifyNoInteractions(chitietCabanMapper);
    }

    @Test
    void chonSizeTrungTenVanKhoiPhucDungCauHinhCu() {
        when(loaicaRepository.findById(3)).thenReturn(Optional.of(loaiCa));
        Sizeca selectedDuplicate = size(16, "size nhì(vừa)");
        Sizeca historicalSize = size(4, "Size Nhì (Vừa)");
        Chitietcaban deletedRecord = deletedRecord(109, historicalSize);
        ChitietCabanCreationRequest request = request(16);

        when(sizecaRepository.findById(16)).thenReturn(Optional.of(selectedDuplicate));
        when(chitietcabanRepository.findByIdloaicaAndIdsizeca(loaiCa, selectedDuplicate))
                .thenReturn(Optional.empty());
        when(chitietcabanRepository.findByIdloaicaAndDeletedTrue(loaiCa))
                .thenReturn(List.of(deletedRecord));
        when(chitietcabanRepository.save(deletedRecord)).thenReturn(deletedRecord);

        ChitietCabanResponse response = service.taoMoi(request);

        assertEquals(109, response.getId());
        assertEquals(4, response.getIdSizeCa());
        verifyNoInteractions(chitietCabanMapper);
    }

    @Test
    void cauHinhDaLuuNhungChuaCoGiaVanChoPhepTiepTucThietLap() {
        when(loaicaRepository.findById(3)).thenReturn(Optional.of(loaiCa));
        Sizeca size = size(4, "Size Nhì (Vừa)");
        Chitietcaban activeRecord = deletedRecord(109, size);
        activeRecord.setDeleted(false);
        ChitietCabanCreationRequest request = request(4);

        when(sizecaRepository.findById(4)).thenReturn(Optional.of(size));
        when(chitietcabanRepository.findByIdloaicaAndIdsizeca(loaiCa, size))
                .thenReturn(Optional.of(activeRecord));
        when(banggiaRepository.findByChitietcabanAndNgayketthucIsNull(activeRecord))
                .thenReturn(Optional.empty());
        when(chitietcabanRepository.save(activeRecord)).thenReturn(activeRecord);

        ChitietCabanResponse response = service.taoMoi(request);

        assertEquals(109, response.getId());
        assertEquals(4, response.getIdSizeCa());
        verifyNoInteractions(chitietCabanMapper);
    }

    @Test
    void khongChoXoaKichCoKhiConTonKho() {
        Chitietcaban record = deletedRecord(109, size(4, "Size Nhì (Vừa)"));
        record.setDeleted(false);
        record.setSoluongton(new BigDecimal("1.50"));
        when(chitietcabanRepository.findById(109)).thenReturn(Optional.of(record));

        AppExceptions exception = assertThrows(AppExceptions.class, () -> service.xoa(109));

        assertEquals(ErrorCode.CHITIET_CABAN_CON_TON_KHO, exception.getErrorCode());
        assertFalse(record.getDeleted());
        verifyNoInteractions(banggiaRepository);
        verify(chitietcabanRepository, never()).save(any());
    }

    @Test
    void choPhepXoaKichCoKhiTonKhoBangKhong() {
        Chitietcaban record = deletedRecord(109, size(4, "Size Nhì (Vừa)"));
        record.setDeleted(false);
        when(chitietcabanRepository.findById(109)).thenReturn(Optional.of(record));
        when(banggiaRepository.findByChitietcabanAndNgayketthucIsNull(record))
                .thenReturn(Optional.empty());

        service.xoa(109);

        assertTrue(record.getDeleted());
        verify(chitietcabanRepository).save(record);
    }

    private ChitietCabanCreationRequest request(Integer sizeId) {
        return ChitietCabanCreationRequest.builder()
                .idloaica(3)
                .idsizeca(sizeId)
                .soluongton(BigDecimal.ZERO)
                .sokgtuongung(new BigDecimal("2.50"))
                .build();
    }

    private Sizeca size(Integer id, String name) {
        Sizeca size = new Sizeca();
        size.setId(id);
        size.setSizeca(name);
        return size;
    }

    private Chitietcaban deletedRecord(Integer id, Sizeca size) {
        Chitietcaban record = new Chitietcaban();
        record.setId(id);
        record.setIdloaica(loaiCa);
        record.setIdsizeca(size);
        record.setDeleted(true);
        record.setSoluongton(BigDecimal.ZERO);
        return record;
    }
}
