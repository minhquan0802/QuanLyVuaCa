package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.NhacungcapRequest;
import com.minhquan.QuanLyVuaCa.dto.response.NhacungcapResponse;
import com.minhquan.QuanLyVuaCa.entity.Nhacungcap;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.NhacungcapRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NhacungcapService {

    NhacungcapRepository nhacungcapRepository;

    @Transactional(readOnly = true)
    public List<NhacungcapResponse> layTatCa() {
        return nhacungcapRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public NhacungcapResponse taoMoi(NhacungcapRequest request) {
        String name = request.getTenncc().trim();
        String phone = request.getSodienthoai().trim();
        if (nhacungcapRepository.existsByTennccIgnoreCase(name)
                || nhacungcapRepository.existsBySodienthoai(phone)) {
            throw new AppExceptions(ErrorCode.NHACUNGCAP_EXISTED);
        }

        Nhacungcap supplier = new Nhacungcap();
        supplier.setTenncc(name);
        supplier.setSodienthoai(phone);
        return toResponse(nhacungcapRepository.save(supplier));
    }

    private NhacungcapResponse toResponse(Nhacungcap supplier) {
        return NhacungcapResponse.builder()
                .id(supplier.getId())
                .tenncc(supplier.getTenncc())
                .sodienthoai(supplier.getSodienthoai())
                .build();
    }
}
