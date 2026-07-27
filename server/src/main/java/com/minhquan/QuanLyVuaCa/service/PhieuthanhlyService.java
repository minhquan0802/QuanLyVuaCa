package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietPhieuthanhlyRequest;
import com.minhquan.QuanLyVuaCa.dto.request.PhieuthanhlyRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietPhieuthanhlyResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LoHangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.PhieuthanhlyResponse;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiCa;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhLy;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.ChitietphieuthanhlyMapper;
import com.minhquan.QuanLyVuaCa.mapper.PhieuthanhlyMapper;
import com.minhquan.QuanLyVuaCa.repository.*;
import com.minhquan.QuanLyVuaCa.scheduler.LoHangQuaHanScheduler;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PhieuthanhlyService {

    PhieuthanhlyRepository phieuthanhlyRepository;
    ChitietphieuthanhlyRepository chitietphieuthanhlyRepository;
    ChitietphieunhapRepository chitietphieunhapRepository;
    ChitietcabanRepository chitietcabanRepository;
    BanggiaRepository banggiaRepository;
    TaiKhoanRepository taiKhoanRepository;

    PhieuthanhlyMapper phieuthanhlyMapper;
    ChitietphieuthanhlyMapper chitietphieuthanhlyMapper;

    @Transactional
    public PhieuthanhlyResponse taoPhieuThanhly(PhieuthanhlyRequest request) {
        TrangThaiThanhLy trangThai = validateRequest(request);

        // --- 1. Người tạo phiếu (lấy từ user đang đăng nhập) ---
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Taikhoan nguoiTao = taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        // --- 2. Tạo phiếu thanh lý (header) ---
        Phieuthanhly phieuthanhly = phieuthanhlyMapper.toEntity(request);
        phieuthanhly.setIdnguoitaophieu(nguoiTao);
        phieuthanhly.setNgaythanhly(Instant.now());

        phieuthanhly.setTrangthai(trangThai);

        Phieuthanhly savedPhieu = phieuthanhlyRepository.save(phieuthanhly);

        // --- 3. Xử lý từng dòng chi tiết: trừ lô, trừ kho tổng, lưu chi tiết ---
        for (ChitietPhieuthanhlyRequest itemRequest : request.getListChiTiet()) {
            Chitietphieunhap lo = chitietphieunhapRepository.findById(itemRequest.getIdchitietphieunhap())
                    .orElseThrow(() -> new AppExceptions(ErrorCode.CHITIETPHIEUNHAP_NOT_EXISTED));

            BigDecimal soLuongThanhLy = itemRequest.getSoluongthanhly();

            if (lo.getSoluongconlai() == null || lo.getSoluongconlai().compareTo(soLuongThanhLy) < 0) {
                throw new AppExceptions(ErrorCode.SOLUONG_THANHLY_VUOT_QUA_TON_LO);
            }

            Chitietcaban kho = lo.getIdchitietcaban();
            if (kho.getSoluongton() == null || kho.getSoluongton().compareTo(soLuongThanhLy) < 0) {
                throw new AppExceptions(ErrorCode.LO_KHONG_KHOP_TON_KHO);
            }

            // Trừ lô
            lo.setSoluongconlai(lo.getSoluongconlai().subtract(soLuongThanhLy));
            if (lo.getSoluongconlai().compareTo(BigDecimal.ZERO) == 0) {
                lo.setTrangthaica(TrangThaiCa.THANH_LY);
            }
            chitietphieunhapRepository.save(lo);

            // Trừ kho tổng (sản phẩm kho mà lô này thuộc về). Check chuẩn đã nằm ở lô (soluongconlai) phía trên;
            // kho.soluongton là số tổng hợp nên có thể lệch thấp hơn (do đường phụ điều chỉnh cân thực tế COD
            // không đồng bộ lại từng lô) — không chặn bằng exception nữa, chỉ chặn ở 0 để không bị âm.
            BigDecimal soluongTonMoi = kho.getSoluongton().subtract(soLuongThanhLy);
            kho.setSoluongton(soluongTonMoi);
            chitietcabanRepository.save(kho);

            // Tạo dòng chi tiết phiếu thanh lý
            Chitietphieuthanhly chiTiet = chitietphieuthanhlyMapper.toEntity(itemRequest);
            chiTiet.setIdphieuthanhly(savedPhieu);
            chiTiet.setIdchitietcaban(kho);
            chiTiet.setThanhtien(soLuongThanhLy.multiply(itemRequest.getDongia()));
            chitietphieuthanhlyRepository.save(chiTiet);
        }

        return toResponse(savedPhieu);
    }

    private TrangThaiThanhLy validateRequest(PhieuthanhlyRequest request) {
        if (request == null || request.getListChiTiet() == null || request.getListChiTiet().isEmpty()) {
            throw new AppExceptions(ErrorCode.CHITIET_THANHLY_EMPTY);
        }

        TrangThaiThanhLy trangThai;
        try {
            trangThai = TrangThaiThanhLy.valueOf(request.getTrangthai());
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new AppExceptions(ErrorCode.TRANGTHAI_THANHLY_INVALID);
        }

        for (ChitietPhieuthanhlyRequest item : request.getListChiTiet()) {
            if (item == null || item.getSoluongthanhly() == null
                    || item.getSoluongthanhly().compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppExceptions(ErrorCode.SOLUONG_THANHLY_INVALID);
            }

            BigDecimal donGia = item.getDongia();
            if (donGia == null || donGia.compareTo(BigDecimal.ZERO) < 0) {
                throw new AppExceptions(ErrorCode.DONGIA_THANHLY_INVALID);
            }
            if (trangThai == TrangThaiThanhLy.DA_BAN_THANH_LY
                    && donGia.compareTo(BigDecimal.ZERO) == 0) {
                throw new AppExceptions(ErrorCode.DONGIA_THANHLY_INVALID);
            }
            if (trangThai == TrangThaiThanhLy.DA_TIEU_HUY
                    && donGia.compareTo(BigDecimal.ZERO) != 0) {
                throw new AppExceptions(ErrorCode.DONGIA_THANHLY_INVALID);
            }
        }

        return trangThai;
    }

    @Transactional(readOnly = true)
    public List<LoHangResponse> layDanhSachLoConHang(Integer idchitietcaban) {
        Chitietcaban kho = chitietcabanRepository.findById(idchitietcaban)
                .orElseThrow(() -> new AppExceptions(ErrorCode.CHITIET_CABAN_NOT_EXISTED));

        return toLoHangResponses(chitietphieunhapRepository
                .findByIdchitietcabanAndSoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(
                        kho, BigDecimal.ZERO));
    }

    // Tất cả lô còn hàng (mọi loại cá/size) — cho màn hình thanh lý nhanh theo lô
    @Transactional(readOnly = true)
    public List<LoHangResponse> layTatCaLoConHang() {
        return toLoHangResponses(chitietphieunhapRepository
                .findBySoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(BigDecimal.ZERO));
    }

    // Lô còn hàng và có tuổi hàng lớn hơn ngưỡng quy định — cho tab cảnh báo
    @Transactional(readOnly = true)
    public List<LoHangResponse> layDanhSachLoQuaHan() {
        LocalDate nguong = LocalDate.now().minusDays(LoHangQuaHanScheduler.SO_NGAY_QUA_HAN);
        return toLoHangResponses(chitietphieunhapRepository
                .findBySoluongconlaiGreaterThanAndIdphieunhap_NgaynhapLessThan(
                        BigDecimal.ZERO, nguong));
    }

    private List<LoHangResponse> toLoHangResponses(List<Chitietphieunhap> lots) {
        List<Chitietcaban> products = lots.stream()
                .map(Chitietphieunhap::getIdchitietcaban)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        Map<Integer, Banggia> activePrices = products.isEmpty()
                ? Map.of()
                : banggiaRepository.findByChitietcabanInAndNgayketthucIsNull(products)
                        .stream()
                        .collect(Collectors.toMap(
                                price -> price.getChitietcaban().getId(),
                                price -> price,
                                (first, second) -> first.getId() >= second.getId() ? first : second
                        ));

        return lots.stream()
                .map(lot -> toLoHangResponse(
                        lot,
                        lot.getIdchitietcaban() == null
                                ? null
                                : activePrices.get(lot.getIdchitietcaban().getId())
                ))
                .toList();
    }

    private LoHangResponse toLoHangResponse(Chitietphieunhap lo, Banggia activePrice) {
        Chitietcaban kho = lo.getIdchitietcaban();
        return LoHangResponse.builder()
                .idchitietphieunhap(lo.getIdchitietphieunhap())
                .idchitietcaban(kho != null ? kho.getId() : null)
                .tenLoaiCa(kho != null ? kho.getIdloaica().getTenloaica() : null)
                .tenSize(kho != null ? kho.getIdsizeca().getSizeca() : null)
                .ngaynhap(lo.getIdphieunhap().getNgaynhap())
                .soluongnhap(lo.getSoluongnhap())
                .soluongconlai(lo.getSoluongconlai())
                .gianhap(lo.getGianhap())
                .giabanleHienTai(activePrice != null ? activePrice.getGiabanle() : null)
                .giabansiHienTai(activePrice != null ? activePrice.getGiabansi() : null)
                .trangthaica(lo.getTrangthaica() != null ? lo.getTrangthaica().name() : null)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PhieuthanhlyResponse> layDanhSachPhieuThanhLy() {
        List<Phieuthanhly> phieus = phieuthanhlyRepository.findAllByOrderByNgaythanhlyDesc();
        if (phieus.isEmpty()) {
            return List.of();
        }
        Map<String, List<Chitietphieuthanhly>> detailsByReceipt =
                chitietphieuthanhlyRepository.findAllByPhieusWithProduct(phieus).stream()
                        .collect(Collectors.groupingBy(
                                detail -> detail.getIdphieuthanhly().getIdphieuthanhly()));
        return phieus.stream()
                .map(phieu -> toResponse(
                        phieu,
                        detailsByReceipt.getOrDefault(phieu.getIdphieuthanhly(), List.of())))
                .toList();
    }

    private PhieuthanhlyResponse toResponse(Phieuthanhly phieu) {
        return toResponse(phieu, chitietphieuthanhlyRepository.findByIdphieuthanhly(phieu));
    }

    private PhieuthanhlyResponse toResponse(
            Phieuthanhly phieu,
            List<Chitietphieuthanhly> details) {
        Taikhoan nguoiTao = phieu.getIdnguoitaophieu();

        List<ChitietPhieuthanhlyResponse> listChiTietResponse = details.stream()
                .map(chitietphieuthanhlyMapper::toResponse)
                .toList();

        return PhieuthanhlyResponse.builder()
                .idphieuthanhly(phieu.getIdphieuthanhly())
                .tenNguoiTaoPhieu(nguoiTao != null ? nguoiTao.getHo() + " " + nguoiTao.getTen() : null)
                .ngaythanhly(phieu.getNgaythanhly())
                .lydothanhly(phieu.getLydothanhly())
                .trangthai(phieu.getTrangthai() != null ? phieu.getTrangthai().name() : null)
                .ghichu(phieu.getGhichu())
                .listChiTiet(listChiTietResponse)
                .build();
    }
}
