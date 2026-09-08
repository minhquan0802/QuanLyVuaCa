package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.annotation.GhiNhatKy;
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

import java.math.BigDecimal;
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
    @GhiNhatKy(bang = "nhacungcap", hanhDong = "THEM_NHA_CUNG_CAP", thamSoId = -1)
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
        apDungThongTinLienHe(supplier, request);
        supplier.setCongnophaitra(BigDecimal.ZERO);
        return toResponse(nhacungcapRepository.save(supplier));
    }

    @Transactional
    @GhiNhatKy(bang = "nhacungcap", hanhDong = "SUA_NHA_CUNG_CAP")
    public NhacungcapResponse capNhat(Integer id, NhacungcapRequest request) {
        Nhacungcap supplier = nhacungcapRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.NHACUNGCAP_NOT_EXISTED));

        String name = request.getTenncc().trim();
        String phone = request.getSodienthoai().trim();

        // Chỉ báo trùng khi tên/SĐT đã thuộc về một NCC khác, không tính chính nó.
        if (!supplier.getTenncc().equalsIgnoreCase(name)
                && nhacungcapRepository.existsByTennccIgnoreCase(name)) {
            throw new AppExceptions(ErrorCode.NHACUNGCAP_EXISTED);
        }
        if (!phone.equals(supplier.getSodienthoai())
                && nhacungcapRepository.existsBySodienthoai(phone)) {
            throw new AppExceptions(ErrorCode.NHACUNGCAP_EXISTED);
        }

        supplier.setTenncc(name);
        supplier.setSodienthoai(phone);
        apDungThongTinLienHe(supplier, request);
        return toResponse(nhacungcapRepository.save(supplier));
    }

    private void apDungThongTinLienHe(Nhacungcap supplier, NhacungcapRequest request) {
        supplier.setDiachi(rongThanhNull(request.getDiachi()));
        supplier.setEmail(rongThanhNull(request.getEmail()));
        supplier.setMasothue(rongThanhNull(request.getMasothue()));
        supplier.setNguoilienhe(rongThanhNull(request.getNguoilienhe()));
        supplier.setHantramacdinh(request.getHantramacdinh());
    }

    private String rongThanhNull(String giaTri) {
        if (giaTri == null) return null;
        String daTrim = giaTri.trim();
        return daTrim.isEmpty() ? null : daTrim;
    }

    private NhacungcapResponse toResponse(Nhacungcap supplier) {
        return NhacungcapResponse.builder()
                .id(supplier.getId())
                .tenncc(supplier.getTenncc())
                .sodienthoai(supplier.getSodienthoai())
                .diachi(supplier.getDiachi())
                .email(supplier.getEmail())
                .masothue(supplier.getMasothue())
                .nguoilienhe(supplier.getNguoilienhe())
                .hantramacdinh(supplier.getHantramacdinh())
                .congnophaitra(supplier.getCongnophaitra() != null
                        ? supplier.getCongnophaitra() : BigDecimal.ZERO)
                .build();
    }
}
