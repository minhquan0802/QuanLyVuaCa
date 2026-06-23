package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.response.ThongbaoResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.entity.Thongbao;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.minhquan.QuanLyVuaCa.repository.ThongbaoRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Service DUY NHẤT chịu trách nhiệm thông báo (persist + push SSE).
 * Các service khác chỉ gọi guiChoVaiTro()/guiChoTaiKhoan(), không tự quản lý SseEmitter.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ThongBaoService {

    ThongbaoRepository thongbaoRepository;
    TaiKhoanRepository taiKhoanRepository;

    Map<String, List<SseEmitter>> emitterMap = new ConcurrentHashMap<>();

    public SseEmitter subscribe() {
        Taikhoan taikhoan = layTaiKhoanHienTai();
        SseEmitter emitter = new SseEmitter(30L * 60 * 1000); // 30 phút, browser tự reconnect khi timeout

        emitterMap.computeIfAbsent(taikhoan.getIdtaikhoan(), k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> {
            List<SseEmitter> list = emitterMap.get(taikhoan.getIdtaikhoan());
            if (list != null) list.remove(emitter);
        };
        emitter.onCompletion(cleanup::run);
        emitter.onTimeout(cleanup::run);
        emitter.onError(e -> cleanup.run());

        try {
            emitter.send(SseEmitter.event().name("ket-noi").data("ok"));
        } catch (IOException ignored) {
        }

        return emitter;
    }

    @Transactional
    public void guiChoVaiTro(String vaitro, String noidung, String loai, String link) {
        List<Taikhoan> nguoiNhanList = taiKhoanRepository.findByVaitro(vaitro);
        for (Taikhoan nguoiNhan : nguoiNhanList) {
            luuVaPush(nguoiNhan, noidung, loai, link);
        }
    }

    @Transactional
    public void guiChoTaiKhoan(String idtaikhoan, String noidung, String loai, String link) {
        Taikhoan nguoiNhan = taiKhoanRepository.findById(idtaikhoan)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));
        luuVaPush(nguoiNhan, noidung, loai, link);
    }

    public List<ThongbaoResponse> layDanhSach() {
        Taikhoan taikhoan = layTaiKhoanHienTai();
        return thongbaoRepository.findByIdnguoinhanOrderByThoigiantaoDesc(taikhoan)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public long demChuaXem() {
        Taikhoan taikhoan = layTaiKhoanHienTai();
        return thongbaoRepository.countByIdnguoinhanAndDaxemFalse(taikhoan);
    }

    @Transactional
    public void danhDauDaXem(String idthongbao) {
        Taikhoan taikhoan = layTaiKhoanHienTai();
        Thongbao thongbao = thongbaoRepository.findById(idthongbao)
                .orElseThrow(() -> new AppExceptions(ErrorCode.THONGBAO_NOT_EXISTED));

        if (thongbao.getIdnguoinhan() == null
                || !thongbao.getIdnguoinhan().getIdtaikhoan().equals(taikhoan.getIdtaikhoan())) {
            throw new AppExceptions(ErrorCode.THONGBAO_NOT_EXISTED);
        }

        thongbao.setDaxem(true);
        thongbaoRepository.save(thongbao);
    }

    @Transactional
    public void danhDauDaXemTatCa() {
        Taikhoan taikhoan = layTaiKhoanHienTai();
        List<Thongbao> chuaXem = thongbaoRepository.findByIdnguoinhanOrderByThoigiantaoDesc(taikhoan)
                .stream()
                .filter(tb -> !Boolean.TRUE.equals(tb.getDaxem()))
                .toList();
        chuaXem.forEach(tb -> tb.setDaxem(true));
        thongbaoRepository.saveAll(chuaXem);
    }

    private void luuVaPush(Taikhoan nguoiNhan, String noidung, String loai, String link) {
        Thongbao thongbao = new Thongbao();
        thongbao.setIdnguoinhan(nguoiNhan);
        thongbao.setNoidung(noidung);
        thongbao.setLoai(loai);
        thongbao.setLink(link);
        thongbao.setDaxem(false);
        thongbao.setThoigiantao(Instant.now());
        thongbaoRepository.save(thongbao);

        ThongbaoResponse response = toResponse(thongbao);
        List<SseEmitter> emitters = emitterMap.get(nguoiNhan.getIdtaikhoan());
        if (emitters == null) return;

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("thongbao").data(response, MediaType.APPLICATION_JSON));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }

    private Taikhoan layTaiKhoanHienTai() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));
    }

    private ThongbaoResponse toResponse(Thongbao thongbao) {
        return ThongbaoResponse.builder()
                .idthongbao(thongbao.getIdthongbao())
                .noidung(thongbao.getNoidung())
                .loai(thongbao.getLoai())
                .link(thongbao.getLink())
                .daxem(thongbao.getDaxem())
                .thoigiantao(thongbao.getThoigiantao())
                .build();
    }
}
