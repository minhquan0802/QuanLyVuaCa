package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietPhieunhapRequest;
import com.minhquan.QuanLyVuaCa.dto.request.PhieunhapRequest;
import com.minhquan.QuanLyVuaCa.dto.response.PhieunhapResponse;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.Enum.TrangThaiCa;
import com.minhquan.QuanLyVuaCa.Enum.TrangThaiThanhToan;
import com.minhquan.QuanLyVuaCa.mapper.ChitietphieunhapMapper;
import com.minhquan.QuanLyVuaCa.mapper.PhieunhapMapper;
import com.minhquan.QuanLyVuaCa.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
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

    PhieunhapMapper phieunhapMapper;
    ChitietphieunhapMapper chitietphieunhapMapper;
    BanggiaRepository banggiaRepository;

    @Transactional
    public PhieunhapResponse nhapHang(PhieunhapRequest request) {
        // --- 1. TẠO PHIẾU NHẬP ---
        Phieunhap phieunhap = phieunhapMapper.toEntity(request);

        // Tìm và Set Nhà cung cấp
        Nhacungcap ncc = nhacungcapRepository.findById(request.getIdncc())
                .orElseThrow(() -> new RuntimeException("Nhà cung cấp không tồn tại"));
        phieunhap.setIdncc(ncc);

        // Tìm và Set Loại cá
        Loaica loaica = loaicaRepository.findById(request.getIdloaica())
                .orElseThrow(() -> new RuntimeException("Loại cá không tồn tại"));
        phieunhap.setIdloaica(loaica);

        // Set mặc định ngày nhập
        if (phieunhap.getNgaynhap() == null) phieunhap.setNgaynhap(LocalDate.now());

        // Xử lý Enum Trạng thái thanh toán
        if (request.getTrangthaithanhtoan() != null) {
            try {
                // Request gửi String theo format "CHUA_THANH_TOAN" hoặc "DA_THANH_TOAN"
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

                // Ngày thanh lý = Ngày nhập + 2 ngày
                detail.setNgaythanhly(savedPhieu.getNgaynhap().plusDays(2));

                // --- LOGIC KHO (Bảng chitietcaban) ---
                // Cần Size để tìm trong kho
                Sizeca sizeca = sizecaRepository.findById(itemRequest.getIdsizeca())
                        .orElseThrow(() -> new RuntimeException("Size cá không tồn tại"));

                // Tìm trong kho xem đã có cặp (Loại cá - Size) này chưa
                Chitietcaban khoItem = chitietcabanRepository.findByIdloaicaAndIdsizeca(loaica, sizeca)
                        .orElse(null);

                if (khoItem == null) {
                    khoItem = new Chitietcaban();
                    khoItem.setIdloaica(loaica);
                    khoItem.setIdsizeca(sizeca);
                    khoItem.setSoluongton(BigDecimal.ZERO);
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

        return phieunhapMapper.toResponse(savedPhieu);
    }

    // Hàm phụ trợ để xử lý Bảng giá
    private void updateBanggia(Chitietcaban kho, BigDecimal giaLeMoi, BigDecimal giaSiMoi) {
        // Nếu không nhập giá dự kiến thì không cập nhật bảng giá
        if (giaLeMoi == null && giaSiMoi == null) return;

        BigDecimal giaLeInput = giaLeMoi != null ? giaLeMoi : BigDecimal.ZERO;
        BigDecimal giaSiInput = giaSiMoi != null ? giaSiMoi : BigDecimal.ZERO;

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
                // Giá thay đổi -> Đóng giá cũ lại (Set ngày kết thúc là hôm nay hoặc hôm qua tùy logic)
                giaHienTai.setNgayketthuc(LocalDate.now());
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