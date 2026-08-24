package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.annotation.GhiNhatKy;
import com.minhquan.QuanLyVuaCa.dto.request.ThanhToanNccRequest;
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
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.annotation.Value;
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

    CongNoNccService congNoNccService;

    // @NonFinal vì @FieldDefaults(makeFinal = true) sẽ đẩy field vào constructor và Spring đi tìm
    // một bean int thay vì đọc giá trị cấu hình.
    @NonFinal
    @Value("${cong-no-ncc.han-tra-mac-dinh:7}")
    int hanTraMacDinhHeThong;

    PhieunhapMapper phieunhapMapper;
    ChitietphieunhapMapper chitietphieunhapMapper;
    BanggiaRepository banggiaRepository;

    @Transactional(readOnly = true)
    public List<PhieunhapResponse> layDanhSach() {
        return phieunhapRepository.findAll(Sort.by(Sort.Direction.DESC, "ngaynhap"))
                .stream()
                .map(this::toFullResponse)
                .toList();
    }

    /**
     * Đánh dấu phiếu đã trả đủ. Trước đây chỉ lật cờ, nay ghi nhận một khoản thanh toán thật cho
     * phần còn nợ để sổ công nợ NCC và cờ trên phiếu không nói hai chuyện khác nhau.
     * Muốn trả từng phần thì dùng CongNoNCC/{idncc}/thanh-toan.
     */
    @Transactional
    @GhiNhatKy(bang = "phieunhap", hanhDong = "XAC_NHAN_THANH_TOAN_PHIEU_NHAP")
    public void capNhatThanhToan(String id) {
        Phieunhap phieunhap = phieunhapRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.PHIEUNHAP_NOT_EXISTED));

        BigDecimal conNo = congNoNccService.conNoCuaPhieu(phieunhap);
        if (conNo.compareTo(BigDecimal.ZERO) > 0) {
            congNoNccService.thanhToan(phieunhap.getIdncc().getId(), ThanhToanNccRequest.builder()
                    .sotien(conNo)
                    .idphieunhap(phieunhap.getIdphieunhap())
                    .hinhthuc("TIEN_MAT")
                    .ghichu("Xác nhận trả đủ phiếu nhập")
                    .build());
            return; // thanhToan() đã tự lật cờ khi phiếu hết nợ
        }

        phieunhap.setTrangthaithanhtoan(TrangThaiThanhToan.DA_THANH_TOAN);
        phieunhapRepository.save(phieunhap);
    }

    @Transactional
    public PhieunhapResponse nhapHang(PhieunhapRequest request) {
        if (request.getNgaynhap() != null && request.getNgaynhap().isBefore(LocalDate.now())) {
            throw new AppExceptions(ErrorCode.NGAY_NHAP_INVALID);
        }
        request.getListChiTiet().forEach(this::kiemTraGiaBan);

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
        boolean laAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (laAdmin && request.getTrangthaithanhtoan() != null) {
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

        // Chốt tổng tiền ngay tại đây thay vì tính lại từ chi tiết mỗi lần đọc. Sổ công nợ NCC
        // tham chiếu con số này, nên nếu để tính động thì sửa gianhap về sau là lệch sổ.
        BigDecimal tongTien = BigDecimal.ZERO;
        if (request.getListChiTiet() != null) {
            tongTien = request.getListChiTiet().stream()
                    .map(ct -> ct.getSoluongnhap().multiply(ct.getGianhap()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        phieunhap.setTongtien(tongTien);

        // Hạn trả = ngày nhập + số ngày được nợ. LUÔN sinh hạn trả, không để null trong bất kỳ
        // trường hợp nào: CongNoNccDenHanScheduler lọc theo "hantra IS NOT NULL", nên phiếu không
        // có hạn trả sẽ lặng lẽ nằm ngoài mọi lời nhắc dù thực tế đang nợ.
        //   - NCC khai hạn nợ  -> dùng đúng số ngày đó (0 nghĩa là trả ngay, hạn = chính ngày nhập)
        //   - NCC chưa khai    -> lấy mặc định hệ thống từ cong-no-ncc.han-tra-mac-dinh
        int soNgayDuocNo = ncc.getHantramacdinh() != null
                ? Math.max(ncc.getHantramacdinh(), 0)
                : hanTraMacDinhHeThong;
        phieunhap.setHantra(phieunhap.getNgaynhap().plusDays(soNgayDuocNo));

        Phieunhap phieuDaLuu = phieunhapRepository.save(phieunhap);

        // --- 2. XỬ LÝ CHI TIẾT & KHO ---
        if (request.getListChiTiet() != null) {
            List<Chitietphieunhap> danhSachEntity = new ArrayList<>();

            for (ChitietPhieunhapRequest chiTietRequest : request.getListChiTiet()) {
                Chitietphieunhap chiTiet = chitietphieunhapMapper.toEntity(chiTietRequest);

                // Link tới phiếu cha
                chiTiet.setIdphieunhap(phieuDaLuu);

                // Lưu lịch sử giá bán tại thời điểm nhập
                chiTiet.setGiabanletaithoidiemnhap(chiTietRequest.getGiabanletaithoidiemnhap());
                chiTiet.setGiabansitaithoidiemnhap(chiTietRequest.getGiabansitaithoidiemnhap());

                chiTiet.setTrangthaica(TrangThaiCa.CON_HANG);

                // Lô mới luôn full số lượng nhập, dùng để trừ FIFO khi bán/thanh lý
                chiTiet.setSoluongconlai(chiTietRequest.getSoluongnhap());

                // Ngày thanh lý = Ngày nhập + 2 ngày
                chiTiet.setNgaythanhly(phieuDaLuu.getNgaynhap().plusDays(2));

                // --- LOGIC KHO (Bảng chitietcaban) ---
                // Cần Size để tìm trong kho
                Sizeca sizeca = sizecaRepository.findById(chiTietRequest.getIdsizeca())
                        .orElseThrow(() -> new AppExceptions(ErrorCode.SIZECA_NOT_EXISTED));

                // Tìm trong kho xem đã có cặp (Loại cá - Size) này chưa
                Chitietcaban khoHienCo = chitietcabanRepository.findByIdloaicaAndIdsizeca(loaica, sizeca)
                        .orElse(null);

                if (khoHienCo == null) {
                    khoHienCo = new Chitietcaban();
                    khoHienCo.setIdloaica(loaica);
                    khoHienCo.setIdsizeca(sizeca);
                    khoHienCo.setSoluongton(BigDecimal.ZERO);
                } else if (Boolean.TRUE.equals(khoHienCo.getDeleted())) {
                    khoHienCo.setDeleted(false);
                }

                // Cộng dồn tồn kho
                khoHienCo.setSoluongton(khoHienCo.getSoluongton().add(chiTietRequest.getSoluongnhap()));
                Chitietcaban khoDaLuu = chitietcabanRepository.save(khoHienCo);

                // Link chi tiết phiếu nhập tới Kho (quan trọng)
                chiTiet.setIdchitietcaban(khoDaLuu);

                danhSachEntity.add(chiTiet);

                // Cập nhật Bảng giá hiện hành (Logic riêng)
                capNhatBangGia(khoDaLuu, chiTietRequest.getGiabanletaithoidiemnhap(), chiTietRequest.getGiabansitaithoidiemnhap());
            }
            chitietphieunhapRepository.saveAll(danhSachEntity);
        }

        // Phiếu chưa thanh toán -> phát sinh công nợ với NCC. CongNoNccService là nơi duy nhất
        // được cộng trừ nợ, ở đây chỉ bắn sự kiện sang.
        congNoNccService.xuLyPhieuNhapMoi(phieuDaLuu);

        return toFullResponse(phieuDaLuu);
    }

    // Hàm phụ trợ để xử lý Bảng giá
    private void kiemTraGiaBan(ChitietPhieunhapRequest chiTiet) {
        BigDecimal giaLe = chiTiet.getGiabanletaithoidiemnhap();
        BigDecimal giaSi = chiTiet.getGiabansitaithoidiemnhap();
        if (giaLe == null || giaSi == null) {
            throw new AppExceptions(ErrorCode.BANGGIA_BOTH_PRICES_REQUIRED);
        }
        if (giaLe.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppExceptions(ErrorCode.GIABANLE_INVALID);
        }
        if (giaSi.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppExceptions(ErrorCode.GIABANSI_INVALID);
        }
        if (giaSi.compareTo(giaLe) > 0) {
            throw new AppExceptions(ErrorCode.BANGGIA_RELATION_INVALID);
        }
    }

    private PhieunhapResponse toFullResponse(Phieunhap phieunhap) {
        PhieunhapResponse response = phieunhapMapper.toResponse(phieunhap);
        List<ChiTietPhieunhapInResponse> danhSachChiTiet = chitietphieunhapRepository.findByIdphieunhap(phieunhap)
                .stream()
                .map(chiTiet -> {
                    BigDecimal soLuong = chiTiet.getSoluongnhap() != null
                            ? chiTiet.getSoluongnhap() : BigDecimal.ZERO;
                    BigDecimal giaNhap = chiTiet.getGianhap() != null
                            ? chiTiet.getGianhap() : BigDecimal.ZERO;
                    return ChiTietPhieunhapInResponse.builder()
                            .tenSize(chiTiet.getIdchitietcaban() != null
                                    && chiTiet.getIdchitietcaban().getIdsizeca() != null
                                    ? chiTiet.getIdchitietcaban().getIdsizeca().getSizeca()
                                    : "?")
                            .soluongnhap(soLuong)
                            .gianhap(giaNhap)
                            .giabanletaithoidiemnhap(chiTiet.getGiabanletaithoidiemnhap())
                            .giabansitaithoidiemnhap(chiTiet.getGiabansitaithoidiemnhap())
                            .thanhtien(soLuong.multiply(giaNhap))
                            .build();
                })
                .toList();
        response.setListChiTiet(danhSachChiTiet);
        // Ưu tiên tổng tiền đã chốt lúc nhập; chỉ tính động cho phiếu cũ tạo trước khi có cột này.
        BigDecimal tongTienDaChot = phieunhap.getTongtien();
        response.setTongtien(tongTienDaChot != null && tongTienDaChot.compareTo(BigDecimal.ZERO) > 0
                ? tongTienDaChot
                : danhSachChiTiet.stream()
                        .map(ChiTietPhieunhapInResponse::getThanhtien)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
        return response;
    }

    private void capNhatBangGia(Chitietcaban kho, BigDecimal giaLeMoi, BigDecimal giaSiMoi) {
        // Nếu không nhập giá dự kiến thì không cập nhật bảng giá
        if (giaLeMoi == null && giaSiMoi == null) return;
        if (giaLeMoi == null || giaSiMoi == null) {
            throw new AppExceptions(ErrorCode.BANGGIA_BOTH_PRICES_REQUIRED);
        }

        BigDecimal giaLeApDung = giaLeMoi;
        BigDecimal giaSiApDung = giaSiMoi;

        // 1. Tìm giá đang áp dụng hiện tại (ngayketthuc = null)
        // Bạn cần đảm bảo Repository có hàm này: findByChitietcabanAndNgayketthucIsNull(Chitietcaban ct)
        Banggia giaHienTai = banggiaRepository.findByChitietcabanAndNgayketthucIsNull(kho)
                .orElse(null);

        boolean coTheTaoMoi = false;

        if (giaHienTai == null) {
            // Chưa có giá -> Tạo mới
            coTheTaoMoi = true;
        } else {
            // Đã có giá -> So sánh xem có khác không
            BigDecimal leCu = giaHienTai.getGiabanle() != null ? giaHienTai.getGiabanle() : BigDecimal.ZERO;
            BigDecimal siCu = giaHienTai.getGiabansi() != null ? giaHienTai.getGiabansi() : BigDecimal.ZERO;

            if (leCu.compareTo(giaLeApDung) != 0 || siCu.compareTo(giaSiApDung) != 0) {
                if (LocalDate.now().equals(giaHienTai.getNgaybatdau())) {
                    giaHienTai.setGiabanle(giaLeApDung);
                    giaHienTai.setGiabansi(giaSiApDung);
                    banggiaRepository.save(giaHienTai);
                    return;
                }
                // Giá thay đổi -> Đóng giá cũ lại (Set ngày kết thúc là hôm nay hoặc hôm qua tùy logic)
                giaHienTai.setNgayketthuc(LocalDate.now().minusDays(1));
                banggiaRepository.save(giaHienTai);

                coTheTaoMoi = true;
            }
        }

        // 3. Tạo bảng giá mới
        if (coTheTaoMoi) {
            Banggia giaMoi = new Banggia();
            giaMoi.setChitietcaban(kho);
            giaMoi.setGiabanle(giaLeApDung);
            giaMoi.setGiabansi(giaSiApDung);
            giaMoi.setNgaybatdau(LocalDate.now());
            giaMoi.setNgayketthuc(null); // NULL nghĩa là đang hiệu lực

            banggiaRepository.save(giaMoi);
        }
    }
}
