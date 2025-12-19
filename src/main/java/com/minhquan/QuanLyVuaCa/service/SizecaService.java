package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.SizecaRequest;
import com.minhquan.QuanLyVuaCa.dto.response.SizecaResponse;
import com.minhquan.QuanLyVuaCa.entity.Sizeca;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.SizecaMapper;
import com.minhquan.QuanLyVuaCa.repository.LoaicaRepository;
import com.minhquan.QuanLyVuaCa.repository.SizecaRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SizecaService {
    SizecaRepository sizecaRepository;
    SizecaMapper sizecaMapper;

    // Thêm Size mới
    public SizecaResponse createSize(SizecaRequest request) {
        Sizeca sizeca = sizecaMapper.toSizeca(request);
        sizecaRepository.save(sizeca);
        return sizecaMapper.toSizecaResponse(sizeca);
    }

    // Xóa Size
    public void deleteSize(Integer id) {
        if (!sizecaRepository.existsById(id)) {
            throw new AppExceptions(ErrorCode.SIZECA_NOT_EXISTED);
        }
        sizecaRepository.deleteById(id);
    }

    public List<SizecaResponse> getAll() {
        return sizecaRepository.findAll().stream()
                .map(sizecaMapper::toSizecaResponse)
                .collect(Collectors.toList());
    }
}