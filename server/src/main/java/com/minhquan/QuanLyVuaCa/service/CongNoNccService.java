package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.annotation.GhiNhatKy;
import com.minhquan.QuanLyVuaCa.dto.request.ThanhToanNccRequest;
import com.minhquan.QuanLyVuaCa.dto.response.CongNoNccResponse;
import com.minhquan.QuanLyVuaCa.dto.response.CongNoPhieuNhapResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LichSuCongNoNccResponse;
import com.minhquan.QuanLyVuaCa.entity.LichSuCongNoNcc;
import com.minhquan.QuanLyVuaCa.entity.Nhacungcap;
import com.minhquan.QuanLyVuaCa.entity.Phieunhap;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.entity.ThanhToanNhaCungCap;
import com.minhquan.QuanLyVuaCa.enums.LoaiThayDoiCongNo;
import com.minhquan.QuanLyVuaCa.enums.NguonGocCongNoNcc;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToan;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.repository.LichSuCongNoNccRepository;
import com.minhquan.QuanLyVuaCa.repository.NhacungcapRepository;
import com.minhquan.QuanLyVuaCa.repository.PhieunhapRepository;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.minhquan.QuanLyVuaCa.repository.ThanhToanNhaCungCapRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Service DUY NHẤT chịu trách nhiệm công nợ nhà cung cấp — bản soi gương của CongNoService.
 *
 * PhieunhapService chỉ gọi xuLyPhieuNhapMoi(), không tự cộng trừ nợ. Mọi biến động đều đi qua
 * ghiSoCai() để sổ cái lichsucongnoncc luôn khớp với Nhacungcap.congnophaitra.
 *
 * Quy ước dấu: congnophaitra > 0 nghĩa là vựa ĐANG NỢ nhà cung cấp. Trả dư thành số âm
 * (nhà cung cấp nợ lại vựa), giống cách phía khách hàng xử lý số dư trả trước.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CongNoNccService {

    NhacungcapRepository nhacungcapRepository;
    PhieunhapRepository phieunhapRepository;
    ThanhToanNhaCungCapRepository thanhToanNhaCungCapRepository;
    LichSuCongNoNccRepository lichSuCongNoNccRepository;
    TaiKhoanRepository taiKhoanRepository;
    ThongBaoService thongBaoService;

    // Giữ khớp với PhieunhapService: cùng đọc một khóa cấu hình để màn hình hiển thị đúng số ngày
    // mà phiếu nhập mới sẽ thực sự dùng.
    @NonFinal
    @Value("${cong-no-ncc.han-tra-mac-dinh:7}")
    int hanTraMacDinhHeThong;

    // ===== Trigger tự động =====

    /**
     * Phiếu nhập mới ở trạng thái chưa thanh toán -> tăng nợ NCC.
     * Gọi từ PhieunhapService.nhapHang() sau khi đã chốt tongtien của phiếu.
     */
    @Transactional
    public void xuLyPhieuNhapMoi(Phieunhap phieunhap) {
        if (phieunhap.getTrangthaithanhtoan() == TrangThaiThanhToan.DA_THANH_TOAN) {
            return; // trả tiền ngay tại chỗ, không phát sinh công nợ
        }

        BigDecimal tongTien = phieunhap.getTongtien();
        if (tongTien == null || tongTien.compareTo(BigDecimal.ZERO) <= 0) return;

        Nhacungcap ncc = phieunhap.getIdncc();
        BigDecimal soDuMoi = congNoHienTai(ncc).add(tongTien);
        capNhatSoDu(ncc, soDuMoi);

        ghiSoCai(ncc, LoaiThayDoiCongNo.TANG, tongTien, soDuMoi,
                phieunhap.getIdphieunhap(), NguonGocCongNoNcc.PHIEU_NHAP,
                "Nhập hàng ngày " + phieunhap.getNgaynhap(), null);
    }

    // ===== Thao tác thủ công =====

    @Transactional
    @GhiNhatKy(bang = "nhacungcap", hanhDong = "THANH_TOAN_NHA_CUNG_CAP")
    public void thanhToan(Integer idncc, ThanhToanNccRequest request) {
        Nhacungcap ncc = nhacungcapRepository.findById(idncc)
                .orElseThrow(() -> new AppExceptions(ErrorCode.NHACUNGCAP_NOT_EXISTED));

        BigDecimal soTien = request.getSotien();
        if (soTien == null || soTien.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppExceptions(ErrorCode.SOTIEN_THANH_TOAN_KHONG_HOP_LE);
        }

        Phieunhap phieunhap = null;
        if (request.getIdphieunhap() != null && !request.getIdphieunhap().isBlank()) {
            phieunhap = phieunhapRepository.findById(request.getIdphieunhap())
                    .orElseThrow(() -> new AppExceptions(ErrorCode.PHIEUNHAP_NOT_EXISTED));

            if (!phieunhap.getIdncc().getId().equals(idncc)) {
                throw new AppExceptions(ErrorCode.PHIEUNHAP_KHONG_THUOC_NCC);
            }

            BigDecimal conNo = conNoCuaPhieu(phieunhap);
            if (soTien.compareTo(conNo) > 0) {
                throw new AppExceptions(ErrorCode.SOTIEN_VUOT_QUA_CONG_NO_NCC);
            }
        }

        Taikhoan nguoiThucHien = layTaiKhoanHienTai();

        ThanhToanNhaCungCap thanhToan = new ThanhToanNhaCungCap();
        thanhToan.setIdncc(ncc);
        thanhToan.setIdphieunhap(phieunhap);
        thanhToan.setSotien(soTien);
        thanhToan.setHinhthuc(request.getHinhthuc() != null ? request.getHinhthuc() : "TIEN_MAT");
        thanhToan.setNguoithuchien(nguoiThucHien);
        thanhToan.setGhichu(request.getGhichu());
        thanhToan.setNgaythanhtoan(Instant.now());
        ThanhToanNhaCungCap daLuu = thanhToanNhaCungCapRepository.save(thanhToan);

        BigDecimal soDuMoi = congNoHienTai(ncc).subtract(soTien);
        capNhatSoDu(ncc, soDuMoi);

        // Trả đủ cho một phiếu cụ thể thì mới lật cờ của phiếu đó. Trả một phần vẫn để
        // CHUA_THANH_TOAN — đúng bản chất, và phần đã trả đã nằm trong sổ cái.
        if (phieunhap != null && conNoCuaPhieu(phieunhap).compareTo(BigDecimal.ZERO) <= 0) {
            phieunhap.setTrangthaithanhtoan(TrangThaiThanhToan.DA_THANH_TOAN);
            phieunhapRepository.save(phieunhap);
        }

        String ghiChu = phieunhap != null
                ? "Trả tiền phiếu nhập " + phieunhap.getIdphieunhap()
                : "Trả gộp công nợ nhà cung cấp";
        if (request.getGhichu() != null && !request.getGhichu().isBlank()) {
            ghiChu = ghiChu + " — " + request.getGhichu();
        }

        ghiSoCai(ncc, LoaiThayDoiCongNo.GIAM, soTien, soDuMoi,
                daLuu.getIdthanhtoanncc(), NguonGocCongNoNcc.THANH_TOAN_NCC, ghiChu, nguoiThucHien);
    }

    @Transactional
    @GhiNhatKy(bang = "nhacungcap", hanhDong = "DIEU_CHINH_CONG_NO_NCC")
    public void dieuChinhThuCong(Integer idncc, BigDecimal soTien, boolean tang, String ghiChu) {
        Nhacungcap ncc = nhacungcapRepository.findById(idncc)
                .orElseThrow(() -> new AppExceptions(ErrorCode.NHACUNGCAP_NOT_EXISTED));

        if (soTien == null || soTien.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppExceptions(ErrorCode.SOTIEN_THANH_TOAN_KHONG_HOP_LE);
        }

        BigDecimal soDuMoi = tang
                ? congNoHienTai(ncc).add(soTien)
                : congNoHienTai(ncc).subtract(soTien);
        capNhatSoDu(ncc, soDuMoi);

        ghiSoCai(ncc, LoaiThayDoiCongNo.DIEU_CHINH, soTien, soDuMoi, null, null,
                ghiChu, layTaiKhoanHienTai());
    }

    // ===== Truy vấn =====

    @Transactional(readOnly = true)
    public List<CongNoNccResponse> layDanhSach() {
        LocalDate homNay = LocalDate.now();

        List<CongNoNccResponse> ketQua = new ArrayList<>();
        for (Nhacungcap ncc : nhacungcapRepository.findAll()) {
            List<Phieunhap> phieuConNo = phieunhapRepository
                    .findByIdnccAndTrangthaithanhtoanOrderByNgaynhapAsc(ncc, TrangThaiThanhToan.CHUA_THANH_TOAN);

            LocalDate hanGanNhat = phieuConNo.stream()
                    .map(Phieunhap::getHantra)
                    .filter(java.util.Objects::nonNull)
                    .min(Comparator.naturalOrder())
                    .orElse(null);

            ketQua.add(CongNoNccResponse.builder()
                    .idncc(ncc.getId())
                    .tenncc(ncc.getTenncc())
                    .sodienthoai(ncc.getSodienthoai())
                    .email(ncc.getEmail())
                    .diachi(ncc.getDiachi())
                    .nguoilienhe(ncc.getNguoilienhe())
                    .masothue(ncc.getMasothue())
                    .hantramacdinh(ncc.getHantramacdinh())
                    .hanTraApDung(ncc.getHantramacdinh() != null
                            ? Math.max(ncc.getHantramacdinh(), 0) : hanTraMacDinhHeThong)
                    .congnophaitra(congNoHienTai(ncc))
                    .soPhieuConNo(phieuConNo.size())
                    .hanTraGanNhat(hanGanNhat)
                    .daQuaHan(hanGanNhat != null && hanGanNhat.isBefore(homNay))
                    .build());
        }

        // Quá hạn lên đầu, rồi tới nợ nhiều nhất — cùng tinh thần mucDoUuTien() phía khách hàng.
        ketQua.sort(Comparator
                .comparing(CongNoNccResponse::isDaQuaHan, Comparator.reverseOrder())
                .thenComparing(CongNoNccResponse::getCongnophaitra, Comparator.reverseOrder()));
        return ketQua;
    }

    @Transactional(readOnly = true)
    public List<CongNoPhieuNhapResponse> layPhieuNhapCuaNcc(Integer idncc) {
        Nhacungcap ncc = nhacungcapRepository.findById(idncc)
                .orElseThrow(() -> new AppExceptions(ErrorCode.NHACUNGCAP_NOT_EXISTED));

        LocalDate homNay = LocalDate.now();
        return phieunhapRepository.findByIdnccOrderByNgaynhapDesc(ncc).stream()
                .map(phieunhap -> {
                    BigDecimal tongTien = phieunhap.getTongtien() != null
                            ? phieunhap.getTongtien() : BigDecimal.ZERO;
                    BigDecimal daTra = thanhToanNhaCungCapRepository.tongDaTraChoPhieu(phieunhap);
                    BigDecimal conNo = tongTien.subtract(daTra);
                    return CongNoPhieuNhapResponse.builder()
                            .idphieunhap(phieunhap.getIdphieunhap())
                            .tenLoaiCa(phieunhap.getIdloaica() != null
                                    ? phieunhap.getIdloaica().getTenloaica() : null)
                            .ngaynhap(phieunhap.getNgaynhap())
                            .hantra(phieunhap.getHantra())
                            .tongtien(tongTien)
                            .daTra(daTra)
                            .conNo(conNo)
                            .trangthaithanhtoan(phieunhap.getTrangthaithanhtoan() != null
                                    ? phieunhap.getTrangthaithanhtoan().name() : null)
                            .daQuaHan(phieunhap.getHantra() != null
                                    && phieunhap.getHantra().isBefore(homNay)
                                    && conNo.compareTo(BigDecimal.ZERO) > 0)
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LichSuCongNoNccResponse> layLichSu(Integer idncc) {
        Nhacungcap ncc = nhacungcapRepository.findById(idncc)
                .orElseThrow(() -> new AppExceptions(ErrorCode.NHACUNGCAP_NOT_EXISTED));

        return lichSuCongNoNccRepository.findByIdnccOrderByNgaytaoDesc(ncc).stream()
                .map(ls -> LichSuCongNoNccResponse.builder()
                        .idlichsucongnoncc(ls.getIdlichsucongnoncc())
                        .loaithaydoi(ls.getLoaithaydoi() != null ? ls.getLoaithaydoi().name() : null)
                        .sotien(ls.getSotien())
                        .sodusaukhithaydoi(ls.getSodusaukhithaydoi())
                        .nguongocid(ls.getNguongocid())
                        .nguongocloai(ls.getNguongocloai() != null ? ls.getNguongocloai().name() : null)
                        .tenNguoiThucHien(ls.getNguoithuchien() != null
                                ? (ls.getNguoithuchien().getHo() + " " + ls.getNguoithuchien().getTen()).trim()
                                : null)
                        .ghichu(ls.getGhichu())
                        .ngaytao(ls.getNgaytao())
                        .build())
                .toList();
    }

    /** Nhắc các phiếu tới hạn trả trong vòng {@code soNgayTruoc} ngày tới. Dùng cho scheduler. */
    @Transactional(readOnly = true)
    public void nhacPhieuDenHan(int soNgayTruoc) {
        LocalDate moc = LocalDate.now().plusDays(soNgayTruoc);
        LocalDate homNay = LocalDate.now();

        for (Phieunhap phieunhap : phieunhapRepository.timPhieuSapDenHan(TrangThaiThanhToan.DA_THANH_TOAN, moc)) {
            BigDecimal conNo = conNoCuaPhieu(phieunhap);
            if (conNo.compareTo(BigDecimal.ZERO) <= 0) continue;

            String tenNcc = phieunhap.getIdncc() != null ? phieunhap.getIdncc().getTenncc() : "?";
            boolean quaHan = phieunhap.getHantra().isBefore(homNay);
            String noiDung = quaHan
                    ? String.format("QUÁ HẠN trả %s: còn nợ %sđ (phiếu nhập %s, hạn %s).",
                        tenNcc, conNo, phieunhap.getIdphieunhap(), phieunhap.getHantra())
                    : String.format("Sắp tới hạn trả %s: còn nợ %sđ (phiếu nhập %s, hạn %s).",
                        tenNcc, conNo, phieunhap.getIdphieunhap(), phieunhap.getHantra());

            thongBaoService.guiChoVaiTro("ADMIN", noiDung, "CONG_NO_NCC_DEN_HAN", "/admin/QuanLyCongNoNCC");
        }
    }

    // ===== Hàm phụ =====

    public BigDecimal conNoCuaPhieu(Phieunhap phieunhap) {
        BigDecimal tongTien = phieunhap.getTongtien() != null ? phieunhap.getTongtien() : BigDecimal.ZERO;
        return tongTien.subtract(thanhToanNhaCungCapRepository.tongDaTraChoPhieu(phieunhap));
    }

    private BigDecimal congNoHienTai(Nhacungcap ncc) {
        return ncc.getCongnophaitra() != null ? ncc.getCongnophaitra() : BigDecimal.ZERO;
    }

    private void capNhatSoDu(Nhacungcap ncc, BigDecimal soDuMoi) {
        ncc.setCongnophaitra(soDuMoi);
        nhacungcapRepository.save(ncc);
    }

    private void ghiSoCai(Nhacungcap ncc, LoaiThayDoiCongNo loai, BigDecimal soTien, BigDecimal soDuSau,
                          String nguonGocId, NguonGocCongNoNcc nguonGocLoai, String ghiChu, Taikhoan nguoiThucHien) {
        LichSuCongNoNcc lichSu = new LichSuCongNoNcc();
        lichSu.setIdncc(ncc);
        lichSu.setLoaithaydoi(loai);
        lichSu.setSotien(soTien);
        lichSu.setSodusaukhithaydoi(soDuSau);
        lichSu.setNguongocid(nguonGocId);
        lichSu.setNguongocloai(nguonGocLoai);
        lichSu.setNguoithuchien(nguoiThucHien);
        lichSu.setGhichu(ghiChu);
        lichSu.setNgaytao(Instant.now());
        lichSuCongNoNccRepository.save(lichSu);
    }

    // Trả null khi chạy trong scheduler — sổ cái vẫn ghi được, chỉ là không có người thực hiện.
    private Taikhoan layTaiKhoanHienTai() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return taiKhoanRepository.findByEmail(auth.getName()).orElse(null);
    }
}
