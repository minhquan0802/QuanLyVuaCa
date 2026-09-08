package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.response.NhatKyThaoTacResponse;
import com.minhquan.QuanLyVuaCa.entity.NhatKyThaoTac;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.repository.NhatKyThaoTacRepository;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.List;

/**
 * Ghi và tra cứu nhật ký thao tác.
 *
 * Hai nguyên tắc vận hành:
 *  1. Chỉ ghi thêm — service này cố tình không có API sửa/xóa.
 *  2. Ghi log không được làm hỏng nghiệp vụ — mọi lỗi đều bị nuốt và chỉ log warn. Bản ghi nhật ký
 *     chạy trong transaction riêng (REQUIRES_NEW) để không bị cuốn theo rollback của nghiệp vụ,
 *     và ngược lại lỗi khi ghi nhật ký cũng không kéo nghiệp vụ rollback theo.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NhatKyThaoTacService {

    NhatKyThaoTacRepository nhatKyThaoTacRepository;
    TaiKhoanRepository taiKhoanRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void ghi(String tenBang, String idBanGhi, String hanhDong,
                    String giaTriCu, String giaTriMoi, String ghiChu) {
        try {
            NhatKyThaoTac nhatKy = new NhatKyThaoTac();
            nhatKy.setTenbang(tenBang);
            nhatKy.setIdbanghi(catChuoi(idBanGhi, 36));
            nhatKy.setHanhdong(hanhDong);
            nhatKy.setGiatricu(giaTriCu);
            nhatKy.setGiatrimoi(giaTriMoi);
            nhatKy.setNguoithuchien(layTaiKhoanHienTai());
            nhatKy.setDiachiip(layDiaChiIp());
            nhatKy.setGhichu(catChuoi(ghiChu, 255));
            nhatKy.setThoigian(Instant.now());
            nhatKyThaoTacRepository.save(nhatKy);
        } catch (Exception e) {
            // Nuốt lỗi có chủ đích: mất một dòng nhật ký chấp nhận được, mất một đơn hàng thì không.
            log.warn("Không ghi được nhật ký thao tác [{}.{}]: {}", tenBang, hanhDong, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<NhatKyThaoTacResponse> layTheoBanGhi(String tenBang, String idBanGhi) {
        return nhatKyThaoTacRepository
                .findByTenbangAndIdbanghiOrderByThoigianDesc(tenBang, idBanGhi)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<NhatKyThaoTacResponse> timKiem(String tenBang, String hanhDong, String idNguoiThucHien,
                                               Instant tuNgay, Instant denNgay, int page, int size) {
        return nhatKyThaoTacRepository
                .timKiem(rongThanhNull(tenBang), rongThanhNull(hanhDong), rongThanhNull(idNguoiThucHien),
                        tuNgay, denNgay, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<String> layDanhSachBang() {
        return nhatKyThaoTacRepository.layDanhSachBang();
    }

    @Transactional(readOnly = true)
    public List<String> layDanhSachHanhDong() {
        return nhatKyThaoTacRepository.layDanhSachHanhDong();
    }

    private NhatKyThaoTacResponse toResponse(NhatKyThaoTac nhatKy) {
        Taikhoan nguoi = nhatKy.getNguoithuchien();
        return NhatKyThaoTacResponse.builder()
                .idnhatky(nhatKy.getIdnhatky())
                .tenbang(nhatKy.getTenbang())
                .idbanghi(nhatKy.getIdbanghi())
                .hanhdong(nhatKy.getHanhdong())
                .giatricu(nhatKy.getGiatricu())
                .giatrimoi(nhatKy.getGiatrimoi())
                .tenNguoiThucHien(nguoi != null ? (nguoi.getHo() + " " + nguoi.getTen()).trim() : "Hệ thống")
                .emailNguoiThucHien(nguoi != null ? nguoi.getEmail() : null)
                .diachiip(nhatKy.getDiachiip())
                .ghichu(nhatKy.getGhichu())
                .thoigian(nhatKy.getThoigian())
                .build();
    }

    // Trả về null khi chạy trong scheduler hoặc luồng không có người dùng đăng nhập.
    private Taikhoan layTaiKhoanHienTai() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return taiKhoanRepository.findByEmail(auth.getName()).orElse(null);
    }

    private String layDiaChiIp() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) {
            return null;
        }
        String forwarded = attrs.getRequest().getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return catChuoi(forwarded.split(",")[0].trim(), 45);
        }
        return catChuoi(attrs.getRequest().getRemoteAddr(), 45);
    }

    private String catChuoi(String giaTri, int doDaiToiDa) {
        if (giaTri == null) return null;
        return giaTri.length() <= doDaiToiDa ? giaTri : giaTri.substring(0, doDaiToiDa);
    }

    private String rongThanhNull(String giaTri) {
        return (giaTri == null || giaTri.isBlank()) ? null : giaTri;
    }
}
