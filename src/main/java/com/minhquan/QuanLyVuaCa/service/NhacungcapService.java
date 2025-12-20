package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.entity.Nhacungcap;
import com.minhquan.QuanLyVuaCa.repository.NhacungcapRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NhacungcapService {

    private final NhacungcapRepository nhacungcapRepository;

    public List<Nhacungcap> getAll() {
        return nhacungcapRepository.findAll();
    }

    public Nhacungcap create(Nhacungcap ncc) {
        return nhacungcapRepository.save(ncc);
    }
}