package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.QuydoiRequest;
import com.minhquan.QuanLyVuaCa.dto.response.QuydoiResponse;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Quydoi;
import com.minhquan.QuanLyVuaCa.repository.ChitietcabanRepository;
import com.minhquan.QuanLyVuaCa.repository.QuydoiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuydoiService {

    private final QuydoiRepository quydoiRepository;
    private final ChitietcabanRepository chitietcabanRepository;

    public List<QuydoiResponse> getAllQuydois() {
        return quydoiRepository.findAll().stream()
                .map(q -> QuydoiResponse.builder()
                        .id(q.getId())
                        .idchitietcaban(q.getIdchitietcaban().getId())
                        .sokgtuongung(q.getSokgtuongung())
                        .build())
                .collect(Collectors.toList());
    }

    public QuydoiResponse create(QuydoiRequest request) {
        Chitietcaban chitietcaban = chitietcabanRepository.findById(request.getIdchitietcaban())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm kho ID: " + request.getIdchitietcaban()));

        Quydoi quydoi = new Quydoi();
        quydoi.setIdchitietcaban(chitietcaban);
        quydoi.setSokgtuongung(request.getSokgtuongung());

        Quydoi saved = quydoiRepository.save(quydoi);
        return QuydoiResponse.builder()
                .id(saved.getId())
                .idchitietcaban(saved.getIdchitietcaban().getId())
                .sokgtuongung(saved.getSokgtuongung())
                .build();
    }
}
