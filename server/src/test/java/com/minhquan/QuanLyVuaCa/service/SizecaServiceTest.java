package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.SizecaRequest;
import com.minhquan.QuanLyVuaCa.dto.response.SizecaResponse;
import com.minhquan.QuanLyVuaCa.entity.Sizeca;
import com.minhquan.QuanLyVuaCa.mapper.SizecaMapper;
import com.minhquan.QuanLyVuaCa.repository.SizecaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SizecaServiceTest {

    @Mock
    SizecaRepository sizecaRepository;

    @Mock
    SizecaMapper sizecaMapper;

    @InjectMocks
    SizecaService sizecaService;

    @Test
    void trungTenSauKhiBoKhoangTrangThiDungLaiSizeDaCo() {
        SizecaRequest request = SizecaRequest.builder()
                .sizeca(" Size1-2KG ")
                .build();
        Sizeca existing = new Sizeca();
        existing.setId(4);
        existing.setSizeca("Size 1 - 2kg");
        SizecaResponse expected = SizecaResponse.builder()
                .idsizeca(4)
                .sizeca("Size 1 - 2kg")
                .build();

        when(sizecaRepository.findFirstByNormalizedName("size1-2kg"))
                .thenReturn(Optional.of(existing));
        when(sizecaMapper.toSizecaResponse(existing)).thenReturn(expected);

        SizecaResponse actual = sizecaService.taoSize(request);

        assertSame(expected, actual);
        verify(sizecaRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
