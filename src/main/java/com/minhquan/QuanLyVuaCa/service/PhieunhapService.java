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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PhieunhapService {

    private final PhieunhapRepository phieunhapRepository;
    private final ChitietphieunhapRepository chitietphieunhapRepository;
    private final ChitietcabanRepository chitietcabanRepository;
    private final NhacungcapRepository nhacungcapRepository;
    private final LoaicaRepository loaicaRepository;
    private final SizecaRepository sizecaRepository;

    private final PhieunhapMapper phieunhapMapper;
    private final ChitietphieunhapMapper chitietphieunhapMapper;
    private final BanggiaRepository banggiaRepository;

    @Transactional
    public PhieunhapResponse nhapHang(PhieunhapRequest request) {
        // --- 1. TẠO PHIẾU NHẬP ---
        Phieunhap phieunhap = phieunhapMapper.toEntity(request);

        // Tìm và Set Nhà cung cấp
        Nhacungcap ncc = nhacungcapRepository.findById(request.getIdncc())
                .orElseThrow(() -> new RuntimeException("Nhà cung cấp không tồn tại"));
        phieunhap.setIdncc(ncc); // Setter của Lombok sinh ra từ biến "idncc"

        // Tìm và Set Loại cá (Phiếu nhập này dành cho loại cá nào)
        Loaica loaica = loaicaRepository.findById(request.getIdloaica())
                .orElseThrow(() -> new RuntimeException("Loại cá không tồn tại"));
        phieunhap.setIdloaica(loaica); // Setter của Lombok

        // Set mặc định
        if (phieunhap.getNgaynhap() == null) phieunhap.setNgaynhap(LocalDate.now());

        // Chuyển String Enum sang Object Enum (nếu Mapper chưa handle)
        // Hoặc nếu Request gửi String đúng tên Enum, Mapper tự lo.
        // Ở đây đảm bảo an toàn:
        if (request.getTrangthaithanhtoan() != null) {
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
                detail.setIdphieunhap(savedPhieu); // Setter: setIdphieunhap

                detail.setSoluongton(itemRequest.getSoluongnhap()); // Tồn = Nhập
                detail.setTrangthaica(TrangThaiCa.CON_HANG);
                detail.setNgaythanhly(savedPhieu.getNgaynhap().plusDays(2)); // Hạn 2 ngày

                // --- LOGIC KHO (Bảng chitietcaban) ---
                Sizeca sizeca = sizecaRepository.findById(itemRequest.getIdsizeca())
                        .orElseThrow(() -> new RuntimeException("Size cá không tồn tại"));

                // Tìm trong kho xem đã có cặp (Loại cá - Size) này chưa
                // Lưu ý: phải truyền Object Loaica và Object Sizeca vào hàm tìm kiếm
                Chitietcaban khoItem = chitietcabanRepository.findByIdloaicaAndIdsizeca(loaica, sizeca)
                        .orElse(null);

                if (khoItem == null) {
                    khoItem = new Chitietcaban();
                    khoItem.setIdloaica(loaica); // Setter: setIdloaica
                    khoItem.setIdsizeca(sizeca); // Setter: setIdsizeca
                    khoItem.setSoluongton(BigDecimal.ZERO);
                }

                // Cộng dồn tồn kho
                khoItem.setSoluongton(khoItem.getSoluongton().add(itemRequest.getSoluongnhap()));
                Chitietcaban savedKho = chitietcabanRepository.save(khoItem);

                // Link chi tiết phiếu nhập tới Kho
                detail.setIdchitietcaban(savedKho); // Setter: setIdchitietcaban

                listEntities.add(detail);
                updateBanggia(savedKho, itemRequest.getGiabanledukien(), itemRequest.getGiabansidukien());
            }
            chitietphieunhapRepository.saveAll(listEntities);
        }

        return phieunhapMapper.toResponse(savedPhieu);
    }

    // Hàm phụ trợ để xử lý Bảng giá (FIXED)
    private void updateBanggia(Chitietcaban kho, BigDecimal giaLeMoi, BigDecimal giaSiMoi) {
        // Validate đầu vào
        if (giaLeMoi == null && giaSiMoi == null) return;

        // Giá trị mặc định nếu null (để tránh lỗi so sánh)
        BigDecimal giaLeInput = giaLeMoi != null ? giaLeMoi : BigDecimal.ZERO;
        BigDecimal giaSiInput = giaSiMoi != null ? giaSiMoi : BigDecimal.ZERO;

        // 1. Tìm giá đang áp dụng hiện tại (Dựa vào query mới sửa)
        Banggia giaHienTai = banggiaRepository.findActivePriceByChitietcaban(kho.getId());

        boolean canCreateNew = false;

        if (giaHienTai == null) {
            // Trường hợp 1: Chưa có giá nào -> Tạo mới
            canCreateNew = true;
        } else {
            // Trường hợp 2: Đã có giá -> So sánh xem có thay đổi không
            // Lưu ý: Cần handle null cho giá cũ trong DB để tránh NullPointerException
            BigDecimal oldLe = giaHienTai.getGiabanle() != null ? giaHienTai.getGiabanle() : BigDecimal.ZERO;
            BigDecimal oldSi = giaHienTai.getGiabansi() != null ? giaHienTai.getGiabansi() : BigDecimal.ZERO;

            if (oldLe.compareTo(giaLeInput) != 0 || oldSi.compareTo(giaSiInput) != 0) {
                // Giá thay đổi -> Đóng giá cũ lại
                giaHienTai.setNgayketthuc(LocalDate.now()); // Kết thúc ngay hôm nay
                banggiaRepository.save(giaHienTai);

                canCreateNew = true;
            }
        }

        // 3. Tạo bảng giá mới (Nếu cần)
        if (canCreateNew) {
            Banggia giaMoi = new Banggia();

            // SỬA LỖI: Dùng setChitietcaban (vì biến trong Entity là 'private Chitietcaban chitietcaban')
            giaMoi.setChitietcaban(kho);

            giaMoi.setGiabanle(giaLeInput);
            giaMoi.setGiabansi(giaSiInput);

            // Giá mới bắt đầu từ hôm nay (hoặc ngày mai tùy nghiệp vụ, ở đây để hôm nay cho liên tục)
            giaMoi.setNgaybatdau(LocalDate.now());

            // Ngày kết thúc để NULL (nghĩa là đang hiệu lực mãi mãi)
            giaMoi.setNgayketthuc(null);

            // XÓA DÒNG NÀY: giaMoi.setTrangThai(...); vì không có cột này

            banggiaRepository.save(giaMoi);
        }
    }}