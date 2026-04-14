package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.entity.Nhacungcap;
import com.minhquan.QuanLyVuaCa.repository.NhacungcapRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NhacungcapService {

    NhacungcapRepository nhacungcapRepository;

    public List<Nhacungcap> getAll() {
        return nhacungcapRepository.findAll();
    }

    public Nhacungcap create(Nhacungcap ncc) {
        return nhacungcapRepository.save(ncc);
    }
}