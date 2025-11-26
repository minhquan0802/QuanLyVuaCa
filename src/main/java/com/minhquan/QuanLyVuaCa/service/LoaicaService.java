package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.repository.LoaicaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LoaicaService {
    private final LoaicaRepository loaicaRepository;

    public List<Loaica> getLoaiCa(){
        return loaicaRepository.findAll();
    }
    public Loaica timLoaica(Integer id){
        return loaicaRepository.findById(id).orElseThrow(()-> new RuntimeException("Khong tim thay loai ca"));
    }
}
