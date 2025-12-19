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

    // Danh sách kho hàng
    public List<ChitietCabanResponse> getAll() {
        return chitietcabanRepository.findAll().stream()
                .map(chitietCabanMapper::toResponse) //element -> chitietCabanMapper.toResponse(element)
                .collect(Collectors.toList());
    }

    // 2. Tạo mới cấu hình sản phẩm (Ghép Loại + Size)
    public ChitietCabanResponse create(ChitietCabanCreationRequest request) {
        Loaica loaiCa = loaicaRepository.findById(request.getIdloaica())
                .orElseThrow(() -> new RuntimeException("Loại cá không tồn tại"));

        Sizeca sizeCa = sizecaRepository.findById(request.getIdsizeca())
                .orElseThrow(() -> new AppExceptions(ErrorCode.SIZECA_NOT_EXISTED));

        // Kiểm tra trùng lặp (Logic mới khớp với DB mới)
        if (chitietcabanRepository.existsByIdloaicaAndIdsizeca(loaiCa, sizeCa)) {
            throw new RuntimeException("Sản phẩm này đã tồn tại!");
        }

        Chitietcaban entity = chitietCabanMapper.toEntity(request);
        entity.setIdloaica(loaiCa); // Set Loại cá
        entity.setIdsizeca(sizeCa); // Set Size

        if (entity.getSoluongton() == null) entity.setSoluongton(BigDecimal.ZERO);

        return chitietCabanMapper.toResponse(chitietcabanRepository.save(entity));
    }


    public void delete(Integer id) {
        if (!chitietcabanRepository.existsById(id)) {
            throw new AppExceptions(ErrorCode.CHITIET_CABAN_NOT_EXISTED);
        }
        try {
            chitietcabanRepository.deleteById(id);
        } catch (Exception e) {
            // Lỗi nếu sản phẩm đã nằm trong đơn hàng cũ
            throw new AppExceptions(ErrorCode.CANNOT_DELETE_DATA_IN_USE);
        }
    }
}