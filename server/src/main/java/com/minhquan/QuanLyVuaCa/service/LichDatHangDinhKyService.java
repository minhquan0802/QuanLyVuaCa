package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietDonhangRequest;
import com.minhquan.QuanLyVuaCa.dto.request.ChiTietLichDatHangRequest;
import com.minhquan.QuanLyVuaCa.dto.request.DonhangRequestCreation;
import com.minhquan.QuanLyVuaCa.dto.request.LichDatHangRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ChiTietLichDatHangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LichDatHangResponse;
import com.minhquan.QuanLyVuaCa.entity.ChiTietLichDatHang;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Donvitinh;
import com.minhquan.QuanLyVuaCa.entity.LichDatHangDinhKy;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.ChiTietLichDatHangRepository;
import com.minhquan.QuanLyVuaCa.repository.ChitietcabanRepository;
import com.minhquan.QuanLyVuaCa.repository.DonvitinhRepository;
import com.minhquan.QuanLyVuaCa.repository.LichDatHangDinhKyRepository;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.minhquan.QuanLyVuaCa.utils.ChinhSachGiaUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

/**
 * Lịch đặt hàng định kỳ cho khách sỉ (đề xuất §8, nhóm 2).
 *
 * Đơn sinh ra đi qua đúng {@link DonhangService#taoDonHang} như khi khách tự bấm đặt — cùng bảng
 * giá, cùng kiểm tra công nợ, cùng trạng thái CHO_XAC_NHAN. Không có đường tắt nào riêng cho đơn
 * định kỳ, nên không có luồng nghiệp vụ thứ hai phải bảo trì song song.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LichDatHangDinhKyService {

    LichDatHangDinhKyRepository lichRepository;
    ChiTietLichDatHangRepository chiTietLichRepository;
    ChitietcabanRepository chitietcabanRepository;
    DonvitinhRepository donvitinhRepository;
    TaiKhoanRepository taiKhoanRepository;
    DonhangService donhangService;
    ThongBaoService thongBaoService;

    // ===== Thao tác của khách =====

    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<LichDatHangResponse> layDanhSachCuaToi() {
        Taikhoan taikhoan = layTaiKhoanHienTai();
        return lichRepository.findByIdtaikhoan_IdtaikhoanOrderByNgaytaoDesc(taikhoan.getIdtaikhoan())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    @PreAuthorize("isAuthenticated()")
    public LichDatHangResponse taoMoi(LichDatHangRequest request) {
        Taikhoan taikhoan = layTaiKhoanHienTai();
        if (!ChinhSachGiaUtils.laKhachSi(taikhoan.getVaitro())) {
            throw new AppExceptions(ErrorCode.LICH_DINH_KY_CHI_DANH_CHO_KHACH_SI);
        }

        LichDatHangDinhKy lich = new LichDatHangDinhKy();
        lich.setIdtaikhoan(taikhoan);
        lich.setNgaytao(Instant.now());
        apDungThayDoi(lich, request);

        LichDatHangDinhKy daLuu = lichRepository.save(lich);
        luuChiTiet(daLuu, request.getChiTiet());
        return toResponse(daLuu);
    }

    @Transactional
    @PreAuthorize("isAuthenticated()")
    public LichDatHangResponse capNhat(String idlich, LichDatHangRequest request) {
        LichDatHangDinhKy lich = layLichCuaToi(idlich);
        apDungThayDoi(lich, request);

        // Xóa sạch rồi ghi lại: giỏ mẫu là một khối, sửa từng dòng không đem lại lợi ích gì mà lại
        // phải đối chiếu thêm/sửa/xóa cho một bảng chỉ có bốn cột.
        chiTietLichRepository.deleteByIdlich(lich);
        chiTietLichRepository.flush();
        luuChiTiet(lich, request.getChiTiet());

        return toResponse(lichRepository.save(lich));
    }

    @Transactional
    @PreAuthorize("isAuthenticated()")
    public LichDatHangResponse doiTrangThai(String idlich, boolean kichHoat) {
        LichDatHangDinhKy lich = layLichCuaToi(idlich);
        lich.setDangkichhoat(kichHoat);
        return toResponse(lichRepository.save(lich));
    }

    @Transactional
    @PreAuthorize("isAuthenticated()")
    public void xoa(String idlich) {
        LichDatHangDinhKy lich = layLichCuaToi(idlich);
        chiTietLichRepository.deleteByIdlich(lich);
        lichRepository.delete(lich);
    }

    // ===== Phần dành cho scheduler =====

    /**
     * ID các lịch tới lượt chạy hôm nay, đã lọc theo thứ trong tuần.
     */
    @Transactional(readOnly = true)
    public List<String> layLichCanChayHomNay() {
        LocalDate homNay = LocalDate.now();
        int thuHomNay = homNay.getDayOfWeek().getValue();

        return lichRepository.timLichCanChay(homNay).stream()
                .filter(lich -> docCacNgay(lich.getCacngaytrongtuan()).contains(thuHomNay))
                .map(LichDatHangDinhKy::getIdlich)
                .toList();
    }

    /**
     * Sinh đơn cho một lịch. Chạy trong giao dịch RIÊNG: một khách vượt hạn mức công nợ không được
     * phép kéo theo đơn của những khách khác trong cùng buổi sáng.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String taoDonTuLich(String idlich) {
        LichDatHangDinhKy lich = lichRepository.findById(idlich)
                .orElseThrow(() -> new AppExceptions(ErrorCode.LICH_DINH_KY_NOT_EXISTED));

        List<ChitietDonhangRequest> dongDon = new ArrayList<>();
        for (ChiTietLichDatHang muc : chiTietLichRepository.findByIdlich(lich)) {
            Chitietcaban sanpham = muc.getIdchitietcaban();
            if (Boolean.TRUE.equals(sanpham.getDeleted())) continue; // đã ngừng kinh doanh

            dongDon.add(ChitietDonhangRequest.builder()
                    .idchitietcaban(String.valueOf(sanpham.getId()))
                    .iddonvitinh(String.valueOf(muc.getIddonvitinh().getId()))
                    .soluong(muc.getSoluong())
                    .build());
        }

        if (dongDon.isEmpty()) {
            throw new AppExceptions(ErrorCode.LICH_DINH_KY_THIEU_SAN_PHAM);
        }

        String tenLich = lich.getTenlich() != null && !lich.getTenlich().isBlank()
                ? lich.getTenlich() : "Lịch định kỳ";

        var donHang = donhangService.taoDonHang(DonhangRequestCreation.builder()
                .idthongtinkhachhang(lich.getIdtaikhoan().getIdtaikhoan())
                .ngaydat(LocalDateTime.now())
                .trangthaidonhang(TrangThaiDonHang.CHO_XAC_NHAN)
                .chiTietDonHang(dongDon)
                .ghichu("Đơn tự sinh từ " + tenLich
                        + (lich.getGhichu() != null && !lich.getGhichu().isBlank()
                            ? " — " + lich.getGhichu() : ""))
                .build());

        return donHang.getIddonhang();
    }

    /**
     * Đóng dấu lần chạy và báo cho khách. Tách khỏi {@link #taoDonTuLich} và cũng chạy trong giao
     * dịch riêng vì lý do rất cụ thể: khi tạo đơn ném lỗi, giao dịch kia đã bị đánh rollback-only,
     * nên nếu ghi lanchaycuoi chung chỗ đó thì dấu chạy cũng bị cuốn theo — sáng hôm sau job lại
     * thấy lịch "chưa chạy" và thử lại vô tận.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void danhDauDaChay(String idlich, String iddonhang, String loi) {
        LichDatHangDinhKy lich = lichRepository.findById(idlich).orElse(null);
        if (lich == null) return;

        lich.setLanchaycuoi(LocalDate.now());
        lich.setLoilanchaycuoi(loi != null && loi.length() > 255 ? loi.substring(0, 255) : loi);
        lichRepository.save(lich);

        String tenLich = lich.getTenlich() != null && !lich.getTenlich().isBlank()
                ? lich.getTenlich() : "lịch định kỳ";
        String idtaikhoan = lich.getIdtaikhoan().getIdtaikhoan();

        if (loi == null) {
            thongBaoService.guiChoTaiKhoan(idtaikhoan,
                    "Đã tạo đơn hàng hôm nay từ " + tenLich + ". Đơn đang chờ vựa xác nhận.",
                    "DON_DINH_KY", "/my-orders");
        } else {
            thongBaoService.guiChoTaiKhoan(idtaikhoan,
                    "Không tạo được đơn hôm nay từ " + tenLich + ": " + loi,
                    "DON_DINH_KY_LOI", "/dat-hang-dinh-ky");
            thongBaoService.guiChoVaiTro("ADMIN",
                    "Lịch định kỳ của khách " + hoTen(lich.getIdtaikhoan()) + " sinh đơn thất bại: " + loi,
                    "DON_DINH_KY_LOI", "/admin/QuanLyDonHang");
        }
    }

    // ===== Hàm phụ =====

    private void apDungThayDoi(LichDatHangDinhKy lich, LichDatHangRequest request) {
        Set<Integer> cacNgay = new TreeSet<>(request.getCacNgayTrongTuan());
        if (cacNgay.stream().anyMatch(thu -> thu == null || thu < 1 || thu > 7)) {
            throw new AppExceptions(ErrorCode.LICH_DINH_KY_NGAY_TRONG_TUAN_INVALID);
        }

        LocalDate batDau = request.getNgaybatdau() != null ? request.getNgaybatdau() : LocalDate.now();
        if (request.getNgayketthuc() != null && request.getNgayketthuc().isBefore(batDau)) {
            throw new AppExceptions(ErrorCode.LICH_DINH_KY_KHOANG_NGAY_INVALID);
        }

        lich.setTenlich(request.getTenlich());
        lich.setCacngaytrongtuan(cacNgay.stream().map(String::valueOf).collect(Collectors.joining(",")));
        lich.setNgaybatdau(batDau);
        lich.setNgayketthuc(request.getNgayketthuc());
        lich.setGhichu(request.getGhichu());
        if (request.getDangkichhoat() != null) {
            lich.setDangkichhoat(request.getDangkichhoat());
        }
    }

    private void luuChiTiet(LichDatHangDinhKy lich, List<ChiTietLichDatHangRequest> danhSach) {
        List<ChiTietLichDatHang> muc = new ArrayList<>();
        for (ChiTietLichDatHangRequest dong : danhSach) {
            Chitietcaban sanpham = chitietcabanRepository.findById(dong.getIdchitietcaban())
                    .orElseThrow(() -> new AppExceptions(ErrorCode.CHITIET_CABAN_NOT_EXISTED,
                            "Không tìm thấy sản phẩm ID: " + dong.getIdchitietcaban()));
            Donvitinh donvitinh = donvitinhRepository.findById(dong.getIddonvitinh())
                    .orElseThrow(() -> new AppExceptions(ErrorCode.DONVITINH_NOT_EXISTED));

            ChiTietLichDatHang moi = new ChiTietLichDatHang();
            moi.setIdlich(lich);
            moi.setIdchitietcaban(sanpham);
            moi.setIddonvitinh(donvitinh);
            moi.setSoluong(dong.getSoluong());
            muc.add(moi);
        }
        chiTietLichRepository.saveAll(muc);
    }

    private LichDatHangDinhKy layLichCuaToi(String idlich) {
        LichDatHangDinhKy lich = lichRepository.findById(idlich)
                .orElseThrow(() -> new AppExceptions(ErrorCode.LICH_DINH_KY_NOT_EXISTED));
        Taikhoan taikhoan = layTaiKhoanHienTai();
        if (!lich.getIdtaikhoan().getIdtaikhoan().equals(taikhoan.getIdtaikhoan())) {
            throw new AppExceptions(ErrorCode.LICH_DINH_KY_KHONG_THUOC_VE_BAN);
        }
        return lich;
    }

    private Taikhoan layTaiKhoanHienTai() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));
    }

    private Set<Integer> docCacNgay(String chuoi) {
        if (chuoi == null || chuoi.isBlank()) return Set.of();
        return Arrays.stream(chuoi.split(","))
                .map(String::trim)
                .filter(phan -> !phan.isEmpty())
                .map(Integer::valueOf)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    /**
     * Ngày kế tiếp lịch sẽ sinh đơn — tìm bằng cách dò tối đa 7 ngày tới.
     *
     * Hôm nay chỉ được tính nếu lịch chưa chạy: đã sinh đơn sáng nay thì lần kế tiếp là tuần sau,
     * và hiển thị "hôm nay" trong trường hợp đó sẽ khiến khách chờ một đơn không bao giờ tới.
     */
    private LocalDate tinhNgayChayKeTiep(LichDatHangDinhKy lich) {
        if (!Boolean.TRUE.equals(lich.getDangkichhoat())) return null;

        Set<Integer> cacNgay = docCacNgay(lich.getCacngaytrongtuan());
        if (cacNgay.isEmpty()) return null;

        LocalDate homNay = LocalDate.now();
        boolean daChayHomNay = homNay.equals(lich.getLanchaycuoi());

        for (int buoc = daChayHomNay ? 1 : 0; buoc <= 7; buoc++) {
            LocalDate ungVien = homNay.plusDays(buoc);
            if (lich.getNgaybatdau() != null && ungVien.isBefore(lich.getNgaybatdau())) continue;
            if (lich.getNgayketthuc() != null && ungVien.isAfter(lich.getNgayketthuc())) return null;
            if (cacNgay.contains(ungVien.getDayOfWeek().getValue())) return ungVien;
        }
        return null;
    }

    private String hoTen(Taikhoan taikhoan) {
        String ho = taikhoan.getHo() != null ? taikhoan.getHo() : "";
        String ten = taikhoan.getTen() != null ? taikhoan.getTen() : "";
        String hoTen = (ho + " " + ten).trim();
        return hoTen.isEmpty() ? taikhoan.getEmail() : hoTen;
    }

    private LichDatHangResponse toResponse(LichDatHangDinhKy lich) {
        List<ChiTietLichDatHangResponse> chiTiet = chiTietLichRepository.findByIdlich(lich).stream()
                .map(muc -> {
                    Chitietcaban sanpham = muc.getIdchitietcaban();
                    return ChiTietLichDatHangResponse.builder()
                            .idchitietlich(muc.getIdchitietlich())
                            .idchitietcaban(sanpham.getId())
                            .tenLoaiCa(sanpham.getIdloaica().getTenloaica())
                            .tenSize(sanpham.getIdsizeca().getSizeca())
                            .hinhAnhUrl(sanpham.getIdloaica().getHinhanhurl())
                            .iddonvitinh(muc.getIddonvitinh().getId())
                            .tenDonViTinh(muc.getIddonvitinh().getTendvt())
                            .soluong(muc.getSoluong())
                            .ngungKinhDoanh(Boolean.TRUE.equals(sanpham.getDeleted()))
                            .build();
                })
                .toList();

        return LichDatHangResponse.builder()
                .idlich(lich.getIdlich())
                .tenlich(lich.getTenlich())
                .cacNgayTrongTuan(docCacNgay(lich.getCacngaytrongtuan()))
                .ngaybatdau(lich.getNgaybatdau())
                .ngayketthuc(lich.getNgayketthuc())
                .dangkichhoat(Boolean.TRUE.equals(lich.getDangkichhoat()))
                .lanchaycuoi(lich.getLanchaycuoi())
                .loilanchaycuoi(lich.getLoilanchaycuoi())
                .ngayChayKeTiep(tinhNgayChayKeTiep(lich))
                .ghichu(lich.getGhichu())
                .chiTiet(chiTiet)
                .build();
    }
}
