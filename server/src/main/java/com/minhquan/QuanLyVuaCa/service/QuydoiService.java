package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.entity.Quydoi;
import com.minhquan.QuanLyVuaCa.repository.QuydoiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuydoiService {

    private final QuydoiRepository quydoiRepository;

    public List<Quydoi> getAllQuydois() {
        return quydoiRepository.findAll();
    }
}