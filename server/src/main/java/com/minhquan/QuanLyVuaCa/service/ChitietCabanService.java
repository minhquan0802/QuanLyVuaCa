package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietCabanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietCabanResponse;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.entity.Sizeca;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.ChitietCabanMapper;
import com.minhquan.QuanLyVuaCa.repository.ChitietcabanRepository;
import com.minhquan.QuanLyVuaCa.repository.LoaicaRepository;
import com.minhquan.QuanLyVuaCa.repository.SizecaRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChitietCabanService {

    ChitietcabanRepository chitietcabanRepository;
    LoaicaRepository loaicaRepository;
    SizecaRepository sizecaRepository;
    ChitietCabanMapper chitietCabanMapper;

    // Chỉ trả về các size chưa bị xóa mềm
    public List<ChitietCabanResponse> getAll() {
        return chitietcabanRepository.findAllByDeletedFalse().stream()
                .map(chitietCabanMapper::toResponse)
                .collect(Collectors.toList());
    }

    // 2. Tạo mới hoặc khôi phục cấu hình sản phẩm (Ghép Loại + Size)
    public ChitietCabanResponse create(ChitietCabanCreationRequest request) {
        Loaica loaiCa = loaicaRepository.findById(request.getIdloaica())
                .orElseThrow(() -> new AppExceptions(ErrorCode.LOAICA_NOT_EXISTED));

        Sizeca sizeCa = sizecaRepository.findById(request.getIdsizeca())
                .orElseThrow(() -> new AppExceptions(ErrorCode.SIZECA_NOT_EXISTED));

        // Nếu từng tồn tại (kể cả đã xóa mềm) thì khôi phục thay vì tạo mới
        // (DB có unique constraint nên không thể tạo trùng)
        var existing = chitietcabanRepository.findByIdloaicaAndIdsizeca(loaiCa, sizeCa);
        if (existing.isPresent()) {
            Chitietcaban record = existing.get();
            if (!record.getDeleted()) {
                throw new AppExceptions(ErrorCode.CHITIET_CABAN_EXISTED);
            }
            record.setDeleted(false);
            return chitietCabanMapper.toResponse(chitietcabanRepository.save(record));
        }

        Chitietcaban entity = chitietCabanMapper.toEntity(request);
        entity.setIdloaica(loaiCa);
        entity.setIdsizeca(sizeCa);
        entity.setDeleted(false);
        if (entity.getSoluongton() == null) entity.setSoluongton(BigDecimal.ZERO);

        return chitietCabanMapper.toResponse(chitietcabanRepository.save(entity));
    }


    public void delete(Integer id) {
        Chitietcaban chitietcaban = chitietcabanRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.CHITIET_CABAN_NOT_EXISTED));
        chitietcaban.setDeleted(true);
        chitietcabanRepository.save(chitietcaban);
    }
}