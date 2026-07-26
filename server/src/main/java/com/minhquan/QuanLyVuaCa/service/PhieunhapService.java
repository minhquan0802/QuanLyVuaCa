package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietPhieunhapRequest;
import com.minhquan.QuanLyVuaCa.dto.request.PhieunhapRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ChiTietPhieunhapInResponse;
import com.minhquan.QuanLyVuaCa.dto.response.PhieunhapResponse;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiCa;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToan;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.ChitietphieunhapMapper;
import com.minhquan.QuanLyVuaCa.mapper.PhieunhapMapper;
import com.minhquan.QuanLyVuaCa.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PhieunhapService {

    PhieunhapRepository phieunhapRepository;
    ChitietphieunhapRepository chitietphieunhapRepository;
    ChitietcabanRepository chitietcabanRepository;
    NhacungcapRepository nhacungcapRepository;
    LoaicaRepository loaicaRepository;
    SizecaRepository sizecaRepository;
    TaiKhoanRepository taiKhoanRepository;

    PhieunhapMapper phieunhapMapper;
    ChitietphieunhapMapper chitietphieunhapMapper;
    BanggiaRepository banggiaRepository;

    @Transactional(readOnly = true)
    public List<PhieunhapResponse> getDanhSach() {
        return phieunhapRepository.findAll(Sort.by(Sort.Direction.DESC, "ngaynhap"))
                .stream()
                .map(this::toFullResponse)
                .toList();
    }

    @Transactional
    public void capNhatThanhToan(String id) {
        Phieunhap phieunhap = phieunhapRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.PHIEUNHAP_NOT_EXISTED));
        phieunhap.setTrangthaithanhtoan(TrangThaiThanhToan.DA_THANH_TOAN);
        phieunhapRepository.save(phieunhap);
    }

    @Transactional
    public PhieunhapResponse nhapHang(PhieunhapRequest request) {
        request.getListChiTiet().forEach(this::validateSalePrices);

        // --- 1. TẠO PHIẾU NHẬP ---
        Phieunhap phieunhap = phieunhapMapper.toEntity(request);

        // Lấy user đang đăng nhập để ghi nhận người tạo phiếu
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        taiKhoanRepository.findByEmail(email).ifPresent(phieunhap::setIdnguoitaophieu);

        // Tìm và Set Nhà cung cấp
        Nhacungcap ncc = nhacungcapRepository.findById(request.getIdncc())
                .orElseThrow(() -> new AppExceptions(ErrorCode.NHACUNGCAP_NOT_EXISTED));
        phieunhap.setIdncc(ncc);

        // Tìm và Set Loại cá
        Loaica loaica = loaicaRepository.findById(request.getIdloaica())
                .orElseThrow(() -> new AppExceptions(ErrorCode.LOAICA_NOT_EXISTED));
        if (Boolean.TRUE.equals(loaica.getDeleted())) {
            throw new AppExceptions(ErrorCode.LOAICA_NOT_ACTIVE);
        }
        phieunhap.setIdloaica(loaica);

        // Set mặc định ngày nhập
        phieunhap.setNgaynhap(request.getNgaynhap() != null ? request.getNgaynhap() : LocalDate.now());

        // Xử lý Enum Trạng thái thanh toán — chỉ ADMIN mới được đặt DA_THANH_TOAN lúc tạo
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin && request.getTrangthaithanhtoan() != null) {
            try {
                phieunhap.setTrangthaithanhtoan(TrangThaiThanhToan.valueOf(request.getTrangthaithanhtoan()));
            } catch (IllegalArgumentException e) {
                phieunhap.setTrangthaithanhtoan(TrangThaiThanhToan.CHUA_THANH_TOAN);
            }
        } else {
            phieunhap.setTrangthaithanhtoan(TrangThaiThanhToan.CHUA_THANH_TOAN);
        }

        // Tính tổng số lượng
        BigDecimal tongSoluong = BigDecimal.ZERO;
        if (request.getListChiTiet() != null) {
            tongSoluong = request.getListChiTiet().stream()
                    .map(ChitietPhieunhapRequest::getSoluongnhap)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        phieunhap.setTongsoluong(tongSoluong);

        Phieunhap savedPhieu = phieunhapRepository.save(phieunhap);

        // --- 2. XỬ LÝ CHI TIẾT & KHO ---
        if (request.getListChiTiet() != null) {
            List<Chitietphieunhap> listEntities = new ArrayList<>();

            for (ChitietPhieunhapRequest itemRequest : request.getListChiTiet()) {
                Chitietphieunhap detail = chitietphieunhapMapper.toEntity(itemRequest);

                // Link tới phiếu cha
                detail.setIdphieunhap(savedPhieu);

                // Lưu lịch sử giá bán tại thời điểm nhập
                detail.setGiabanletaithoidiemnhap(itemRequest.getGiabanletaithoidiemnhap());
                detail.setGiabansitaithoidiemnhap(itemRequest.getGiabansitaithoidiemnhap());

                detail.setTrangthaica(TrangThaiCa.CON_HANG);

                // Lô mới luôn full số lượng nhập, dùng để trừ FIFO khi bán/thanh lý
                detail.setSoluongconlai(itemRequest.getSoluongnhap());

                // Ngày thanh lý = Ngày nhập + 2 ngày
                detail.setNgaythanhly(savedPhieu.getNgaynhap().plusDays(2));

                // --- LOGIC KHO (Bảng chitietcaban) ---
                // Cần Size để tìm trong kho
                Sizeca sizeca = sizecaRepository.findById(itemRequest.getIdsizeca())
                        .orElseThrow(() -> new AppExceptions(ErrorCode.SIZECA_NOT_EXISTED));

                // Tìm trong kho xem đã có cặp (Loại cá - Size) này chưa
                Chitietcaban khoItem = chitietcabanRepository.findByIdloaicaAndIdsizeca(loaica, sizeca)
                        .orElse(null);

                if (khoItem == null) {
                    khoItem = new Chitietcaban();
                    khoItem.setIdloaica(loaica);
                    khoItem.setIdsizeca(sizeca);
                    khoItem.setSoluongton(BigDecimal.ZERO);
                } else if (Boolean.TRUE.equals(khoItem.getDeleted())) {
                    khoItem.setDeleted(false);
                }

                // Cộng dồn tồn kho
                khoItem.setSoluongton(khoItem.getSoluongton().add(itemRequest.getSoluongnhap()));
                Chitietcaban savedKho = chitietcabanRepository.save(khoItem);

                // Link chi tiết phiếu nhập tới Kho (quan trọng)
                detail.setIdchitietcaban(savedKho);

                listEntities.add(detail);

                // Cập nhật Bảng giá hiện hành (Logic riêng)
                updateBanggia(savedKho, itemRequest.getGiabanletaithoidiemnhap(), itemRequest.getGiabansitaithoidiemnhap());
            }
            chitietphieunhapRepository.saveAll(listEntities);
        }

        return toFullResponse(savedPhieu);
    }

    // Hàm phụ trợ để xử lý Bảng giá
    private void validateSalePrices(ChitietPhieunhapRequest detail) {
        BigDecimal retailPrice = detail.getGiabanletaithoidiemnhap();
        BigDecimal wholesalePrice = detail.getGiabansitaithoidiemnhap();
        if (retailPrice == null || wholesalePrice == null) {
            throw new AppExceptions(ErrorCode.BANGGIA_BOTH_PRICES_REQUIRED);
        }
        if (retailPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppExceptions(ErrorCode.GIABANLE_INVALID);
        }
        if (wholesalePrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppExceptions(ErrorCode.GIABANSI_INVALID);
        }
        if (wholesalePrice.compareTo(retailPrice) > 0) {
            throw new AppExceptions(ErrorCode.BANGGIA_RELATION_INVALID);
        }
    }

    private PhieunhapResponse toFullResponse(Phieunhap phieunhap) {
        PhieunhapResponse response = phieunhapMapper.toResponse(phieunhap);
        List<ChiTietPhieunhapInResponse> details = chitietphieunhapRepository.findByIdphieunhap(phieunhap)
                .stream()
                .map(detail -> {
                    BigDecimal quantity = detail.getSoluongnhap() != null
                            ? detail.getSoluongnhap() : BigDecimal.ZERO;
                    BigDecimal importPrice = detail.getGianhap() != null
                            ? detail.getGianhap() : BigDecimal.ZERO;
                    return ChiTietPhieunhapInResponse.builder()
                            .tenSize(detail.getIdchitietcaban() != null
                                    && detail.getIdchitietcaban().getIdsizeca() != null
                                    ? detail.getIdchitietcaban().getIdsizeca().getSizeca()
                                    : "?")
                            .soluongnhap(quantity)
                            .gianhap(importPrice)
                            .thanhtien(quantity.multiply(importPrice))
                            .build();
                })
                .toList();
        response.setListChiTiet(details);
        response.setTongtien(details.stream()
                .map(ChiTietPhieunhapInResponse::getThanhtien)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        return response;
    }

    private void updateBanggia(Chitietcaban kho, BigDecimal giaLeMoi, BigDecimal giaSiMoi) {
        // Nếu không nhập giá dự kiến thì không cập nhật bảng giá
        if (giaLeMoi == null && giaSiMoi == null) return;
        if (giaLeMoi == null || giaSiMoi == null) {
            throw new AppExceptions(ErrorCode.BANGGIA_BOTH_PRICES_REQUIRED);
        }

        BigDecimal giaLeInput = giaLeMoi;
        BigDecimal giaSiInput = giaSiMoi;

        // 1. Tìm giá đang áp dụng hiện tại (ngayketthuc = null)
        // Bạn cần đảm bảo Repository có hàm này: findByChitietcabanAndNgayketthucIsNull(Chitietcaban ct)
        Banggia giaHienTai = banggiaRepository.findByChitietcabanAndNgayketthucIsNull(kho)
                .orElse(null);

        boolean canCreateNew = false;

        if (giaHienTai == null) {
            // Chưa có giá -> Tạo mới
            canCreateNew = true;
        } else {
            // Đã có giá -> So sánh xem có khác không
            BigDecimal oldLe = giaHienTai.getGiabanle() != null ? giaHienTai.getGiabanle() : BigDecimal.ZERO;
            BigDecimal oldSi = giaHienTai.getGiabansi() != null ? giaHienTai.getGiabansi() : BigDecimal.ZERO;

            if (oldLe.compareTo(giaLeInput) != 0 || oldSi.compareTo(giaSiInput) != 0) {
                if (LocalDate.now().equals(giaHienTai.getNgaybatdau())) {
                    giaHienTai.setGiabanle(giaLeInput);
                    giaHienTai.setGiabansi(giaSiInput);
                    banggiaRepository.save(giaHienTai);
                    return;
                }
                // Giá thay đổi -> Đóng giá cũ lại (Set ngày kết thúc là hôm nay hoặc hôm qua tùy logic)
                giaHienTai.setNgayketthuc(LocalDate.now().minusDays(1));
                banggiaRepository.save(giaHienTai);

                canCreateNew = true;
            }
        }

        // 3. Tạo bảng giá mới
        if (canCreateNew) {
            Banggia giaMoi = new Banggia();
            giaMoi.setChitietcaban(kho);
            giaMoi.setGiabanle(giaLeInput);
            giaMoi.setGiabansi(giaSiInput);
            giaMoi.setNgaybatdau(LocalDate.now());
            giaMoi.setNgayketthuc(null); // NULL nghĩa là đang hiệu lực

            banggiaRepository.save(giaMoi);
        }
    }
}
