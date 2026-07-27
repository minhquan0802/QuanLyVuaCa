package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.DonvitinhRequest;
import com.minhquan.QuanLyVuaCa.dto.response.DonvitinhResponse;
import com.minhquan.QuanLyVuaCa.entity.Donvitinh;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.ChitietGioHangRepository;
import com.minhquan.QuanLyVuaCa.repository.ChitietdonhangRepository;
import com.minhquan.QuanLyVuaCa.repository.DonvitinhRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DonvitinhService {
    private final DonvitinhRepository donvitinhRepository;
    private final ChitietGioHangRepository chitietGioHangRepository;
    private final ChitietdonhangRepository chitietdonhangRepository;

    @Transactional(readOnly = true)
    public List<DonvitinhResponse> getAll() {
        return donvitinhRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DonvitinhResponse getById(Integer id) {
        return toResponse(findById(id));
    }

    @Transactional
    public DonvitinhResponse create(DonvitinhRequest request) {
        String ten = request.getTendvt().trim();
        if (donvitinhRepository.existsByTendvtIgnoreCase(ten)) {
            throw new AppExceptions(ErrorCode.DONVITINH_EXISTED);
        }
        Donvitinh entity = new Donvitinh();
        apply(entity, request, ten);
        return toResponse(donvitinhRepository.save(entity));
    }

    @Transactional
    public DonvitinhResponse update(Integer id, DonvitinhRequest request) {
        Donvitinh entity = findById(id);
        String ten = request.getTendvt().trim();
        if (donvitinhRepository.existsByTendvtIgnoreCaseAndIdNot(ten, id)) {
            throw new AppExceptions(ErrorCode.DONVITINH_EXISTED);
        }
        apply(entity, request, ten);
        return toResponse(donvitinhRepository.save(entity));
    }

    @Transactional
    public void delete(Integer id) {
        Donvitinh entity = findById(id);
        if (chitietGioHangRepository.existsByIddonvitinh(entity)
                || chitietdonhangRepository.existsByIddonvitinh(entity)) {
            throw new AppExceptions(ErrorCode.CANNOT_DELETE_DATA_IN_USE);
        }
        donvitinhRepository.delete(entity);
    }

    private Donvitinh findById(Integer id) {
        return donvitinhRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.DONVITINH_NOT_EXISTED));
    }

    private void apply(Donvitinh entity, DonvitinhRequest request, String ten) {
        entity.setTendvt(ten);
        entity.setHesokg(request.getHesokg());
        entity.setGhichu(request.getGhichu() == null ? null : request.getGhichu().trim());
    }

    private DonvitinhResponse toResponse(Donvitinh entity) {
        return DonvitinhResponse.builder()
                .id(entity.getId())
                .tendvt(entity.getTendvt())
                .hesokg(entity.getHesokg())
                .ghichu(entity.getGhichu())
                .build();
    }
}
