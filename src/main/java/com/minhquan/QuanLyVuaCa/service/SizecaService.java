package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.SizecaRequest;
import com.minhquan.QuanLyVuaCa.dto.response.SizecaResponse;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
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
    LoaicaRepository loaicaRepository;
    SizecaMapper sizecaMapper; // Inject Mapper vào đây

    // 1. Lấy danh sách size
    public List<SizecaResponse> getSizeByLoaiCa(Integer idLoaiCa) {
        Loaica loaica = loaicaRepository.findById(idLoaiCa)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        return sizecaRepository.findByIdloaica(loaica).stream()
                .map(sizecaMapper::toSizecaResponse) // Dùng Mapper ở đây
                .collect(Collectors.toList());
    }

    // 2. Thêm Size mới
    public SizecaResponse createSize(SizecaRequest request) {
        // Tìm Loại cá từ DB (Bắt buộc phải làm ở Service)
        Loaica loaica = loaicaRepository.findById(request.getIdloaica())
                .orElseThrow(() -> new RuntimeException("Loại cá không tồn tại"));

        // Dùng Mapper để map các trường cơ bản (như tên size)
        Sizeca sizeca = sizecaMapper.toSizeca(request);

        // SET THỦ CÔNG MỐI QUAN HỆ (Vì Mapper đã ignore)
        sizeca.setIdloaica(loaica);

        sizecaRepository.save(sizeca);

        // Dùng Mapper để trả về kết quả
        return sizecaMapper.toSizecaResponse(sizeca);
    }

    // 3. Xóa Size
    public void deleteSize(Integer id) {
        if (!sizecaRepository.existsById(id)) {
            throw new RuntimeException("Size không tồn tại");
        }
        sizecaRepository.deleteById(id);
    }

    // Helper: Map Entity -> Response
    private SizecaResponse toResponse(Sizeca entity) {
        return SizecaResponse.builder()
                .idsizeca(entity.getId())
                .sizeca(entity.getSizeca())
                .idloaica(entity.getIdloaica().getId())
                .tenloaica(entity.getIdloaica().getTenloaica())
                .build();
    }
}