package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.dto.response.VaitroResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.entity.Vaitro;
import com.minhquan.QuanLyVuaCa.mapper.VaitroMapper;
import com.minhquan.QuanLyVuaCa.repository.VaitroRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class VaitroService {
    VaitroRepository repository;
    VaitroMapper mapper;

    @PreAuthorize("hasRole('admin')")
    public List<VaitroResponse> getVaiTros(){
        List<Vaitro> vaitros = repository.findAll();
        List<VaitroResponse> responses = new ArrayList<>();
        for (Vaitro vt : vaitros) {
            responses.add(mapper.toVaitroResponse(vt));
        }
        return responses;
    }
}
