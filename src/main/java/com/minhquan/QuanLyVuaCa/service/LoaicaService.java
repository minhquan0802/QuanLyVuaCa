package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.LoaicaCeationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.LoaicaUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.LoaicaResponse;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.LoaicaMapper;
import com.minhquan.QuanLyVuaCa.repository.LoaicaRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class LoaicaService {
    LoaicaRepository loaicaRepository;
    LoaicaMapper mapper;

    public List<LoaicaResponse> getLoaiCa(){
        List<Loaica> Loaicas = loaicaRepository.findAll();
        List<LoaicaResponse> responses = new ArrayList<>();
        for (Loaica lc : Loaicas) {
            responses.add(mapper.toLoaicaResponse(lc));
        }
        return responses;
    }
    public LoaicaResponse timLoaica(Integer id){
        return mapper.toLoaicaResponse(loaicaRepository.findById(id).orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED)));
    }

    public LoaicaResponse taoLoaica(LoaicaCeationRequest request) {

        // Nếu tên loại cá có unique thì check trùng
        if (loaicaRepository.existsByTenloaica(request.getTenloaica())) {
            throw new AppExceptions(ErrorCode.DATA_EXISTED);
        }

        Loaica loaica = mapper.toLoaica(request);
        Loaica saved = loaicaRepository.save(loaica);

        return mapper.toLoaicaResponse(saved);
    }

    public LoaicaResponse capNhatLoaica(Integer id, LoaicaUpdateRequest request) {
        Loaica loaica = loaicaRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        // MapStruct tự map các field có trong request
        mapper.updateLoaica(loaica, request);

        Loaica updated = loaicaRepository.save(loaica);

        return mapper.toLoaicaResponse(updated);
    }

    public void xoaLoaica(Integer id) {
        if (!loaicaRepository.existsById(id)) {
            throw new AppExceptions(ErrorCode.USER_NOT_EXISTED);
        }
        loaicaRepository.deleteById(id);
    }

}
