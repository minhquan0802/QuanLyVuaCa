package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.enums.TrangThaiCa;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.dto.request.ChitietDonhangRequest;
import com.minhquan.QuanLyVuaCa.dto.request.DonhangRequestCreation;
import com.minhquan.QuanLyVuaCa.dto.request.UpdateCanNangRequest;
import com.minhquan.QuanLyVuaCa.dto.response.BaoCaoLechKhoResponse;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietDonhangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.DonhangResponse;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.DonhangMapper;
import com.minhquan.QuanLyVuaCa.repository.*;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DonhangService {

    DonhangRepository donhangRepository;
    ChitietdonhangRepository chitietdonhangRepository;
    ChitietcabanRepository chitietcabanRepository;
    ChitietphieunhapRepository chitietphieunhapRepository;
    DonvitinhRepository donvitinhRepository;
    TaiKhoanRepository taikhoanRepository;
    DonhangMapper donhangMapper;
    CongNoService congNoService;

    QuydoiRepository quydoiRepository;
    BanggiaRepository banggiaRepository;

    @Transactional
    public DonhangResponse createDonhang(DonhangRequestCreation request) {

        Donhang donhang = donhangMapper.toDonhang(request);

        if (request.getNgaydat() != null) {
            donhang.setNgaydat(request.getNgaydat());
        } else {
            donhang.setNgaydat(LocalDateTime.now());
        }

        if (request.getTrangthaidonhang() != null) {
            donhang.setTrangthaidonhang(request.getTrangthaidonhang());
        } else {
            donhang.setTrangthaidonhang(TrangThaiDonHang.CHO_XAC_NHAN);
        }

        // Khách lẻ: auto-fill tên nếu FE bỏ trống
        if (request.getIdthongtinkhachhang() == null || request.getIdthongtinkhachhang().isBlank()) {
            if (donhang.getTenKhachLe() == null || donhang.getTenKhachLe().isBlank()) {
                donhang.setTenKhachLe("Khách vãng lai");
            }
        }

        // Xác định loại khách hàng để áp giá đúng
        boolean isWholesale = false;
        if (request.getIdthongtinkhachhang() != null) {
            var khachOpt = taikhoanRepository.findById(request.getIdthongtinkhachhang());
            if (khachOpt.isPresent()) {
                isWholesale = "CUSTOMER".equals(khachOpt.get().getVaitro()) || "WHOLESALE_CUSTOMER".equals(khachOpt.get().getVaitro());
            }
        }

        // Công nợ Phase 4: chặn TRƯỚC KHI lưu đơn để tránh tính đôi giỏ hàng
        // (nếu check sau save thì đơn mới đã vào DB → tongTienDonDangXuLy đếm nó + gioHang đếm lại = double count)
        if (request.getIdthongtinkhachhang() != null) {
            congNoService.kiemTraDuocDatHang(request.getIdthongtinkhachhang(), isWholesale);
        }

        // Lưu đơn hàng sau khi đã qua kiểm tra công nợ
        Donhang savedDonhang = donhangRepository.save(donhang);
        BigDecimal tongTienDonHang = BigDecimal.ZERO;

        // 2. Xử lý chi tiết đơn hàng
        if (request.getChiTietDonHang() != null && !request.getChiTietDonHang().isEmpty()) {

            List<Chitietdonhang> listChiTietEntity = new ArrayList<>();

            for (ChitietDonhangRequest ctdhRequest : request.getChiTietDonHang()) {
                Chitietdonhang ct = donhangMapper.toChitietEntity(ctdhRequest);
                ct.setIddonhang(savedDonhang);

                // --- A. Xử lý Chitietcaban (Sản phẩm kho) ---
                Chitietcaban chitietcabanTemp = null;
                if (ctdhRequest.getIdchitietcaban() != null) {
                    Integer idChiTiet = Integer.parseInt(ctdhRequest.getIdchitietcaban());
                    // Lock row này lại để tránh concurrency nếu cần (hoặc chỉ findById)
                    chitietcabanTemp = chitietcabanRepository.findById(idChiTiet)
                            .orElseThrow(() -> new AppExceptions(ErrorCode.CHITIET_CABAN_NOT_EXISTED,
                                    "Không tìm thấy sản phẩm kho ID: " + ctdhRequest.getIdchitietcaban()));
                } else {
                    throw new AppExceptions(ErrorCode.THIEU_ID_CHITIET_CABAN);
                }
                ct.setIdchitietcaban(chitietcabanTemp);

                Chitietcaban finalChitietcaban = chitietcabanTemp;

                // --- B. Tính toán Tiền & Số lượng quy đổi ---

                // B1. Lấy đơn vị tính và hệ số quy đổi
                String idDvtStr = ctdhRequest.getIddonvitinh();
                Donvitinh donvitinh = idDvtStr != null
                        ? donvitinhRepository.findById(Integer.parseInt(idDvtStr)).orElse(null)
                        : donvitinhRepository.findById(1).orElse(null);
                ct.setIddonvitinh(donvitinh);

                BigDecimal heSoQuyDoi;
                if (donvitinh != null && donvitinh.getHesokg() != null && donvitinh.getHesokg().compareTo(BigDecimal.ZERO) > 0) {
                    heSoQuyDoi = donvitinh.getHesokg(); // Kg hoặc Bao: dùng hesokg cố định
                } else {
                    heSoQuyDoi = quydoiRepository.findByIdchitietcaban(finalChitietcaban) // Con: dùng hệ số theo loại cá
                            .map(Quydoi::getSokgtuongung)
                            .orElse(BigDecimal.ONE);
                }

                // B2. Lấy giá bán hiện tại
                Banggia banggia = banggiaRepository.findByChitietcabanAndNgayketthucIsNull(finalChitietcaban)
                        .orElseThrow(() -> new AppExceptions(ErrorCode.BANGGIA_CHUA_AP_DUNG,
                                "Sản phẩm chưa có bảng giá áp dụng (ID Kho: " + finalChitietcaban.getId() + ")"));

                // B3. Xác định giá áp dụng (Sỉ hay Lẻ)
                BigDecimal donGiaApDung = isWholesale ? banggia.getGiabansi() : banggia.getGiabanle();
                if (donGiaApDung == null) donGiaApDung = banggia.getGiabanle();
                if (donGiaApDung == null) donGiaApDung = BigDecimal.ZERO;

                // B4. Tính toán
                BigDecimal soLuongDat = new BigDecimal(ct.getSoluong());
                BigDecimal soLuongKgQuyDoi = soLuongDat.multiply(heSoQuyDoi);
                BigDecimal thanhTienDuKien = soLuongKgQuyDoi.multiply(donGiaApDung);

                // B5. Set dữ liệu (Logic: Ban đầu Dự kiến == Thực tế)

                // Set nhóm Dự Kiến (để lưu vết ban đầu)
                ct.setKhoiluongdukien(soLuongKgQuyDoi);
                ct.setTongtiendukien(thanhTienDuKien);

                // Set nhóm Thực Tế (để tính tiền ngay lúc này)
                ct.setKhoiluongthucte(soLuongKgQuyDoi);
                ct.setTongtienthucte(thanhTienDuKien);

                tongTienDonHang = tongTienDonHang.add(thanhTienDuKien);

                // --- C. TRỪ TỒN KHO NGAY NẾU ĐƠN KHÔNG ĐI QUA PIPELINE CHỜ XÁC NHẬN ---
                // Đơn tạo thẳng với trạng thái khác CHO_XAC_NHAN (ví dụ bán tại quầy - POS, xem
                // TaoDonHang.jsx gửi thẳng "DA_THANH_TOAN") coi như đã hoàn tất ngay -> trừ kho/lô
                // lúc tạo luôn. Đơn CHO_XAC_NHAN (mặc định, đặt qua checkout online) để dành trừ ở
                // updateStatus() khi rời CHO_XAC_NHAN — riêng đơn thanh toán VNPAY thì callback
                // thanh toán tự trừ qua truSoluongTon(), không đi qua updateStatus() nên không trừ trùng.
                if (savedDonhang.getTrangthaidonhang() != TrangThaiDonHang.CHO_XAC_NHAN) {
                    BigDecimal luongCanTru = soLuongKgQuyDoi;

                    if (finalChitietcaban.getSoluongton().compareTo(luongCanTru) < 0) {
                        throw new AppExceptions(ErrorCode.INVENTORY_NOT_ENOUGH, "Sản phẩm " + finalChitietcaban.getIdloaica().getTenloaica()
                                + " không đủ hàng! (Tồn: " + finalChitietcaban.getSoluongton() + ", Đặt: " + luongCanTru + ")");
                    }

                    truLoFifo(finalChitietcaban, luongCanTru);
                    finalChitietcaban.setSoluongton(finalChitietcaban.getSoluongton().subtract(luongCanTru));
                    chitietcabanRepository.save(finalChitietcaban);
                }

                // --- D. Xử lý Đơn vị tính ---
                // Đơn vị tính đã được set ở B1

                listChiTietEntity.add(ct);
            }

            if (!listChiTietEntity.isEmpty()) {
                chitietdonhangRepository.saveAll(listChiTietEntity);
            }
        }

        // 3. Chuẩn bị dữ liệu trả về
        String tenKhach;
        String sdtKhach;

        if (savedDonhang.getIdthongtinkhachhang() != null) {
            var khachOpt = taikhoanRepository.findById(savedDonhang.getIdthongtinkhachhang());
            if (khachOpt.isPresent()) {
                var khach = khachOpt.get();
                tenKhach = khach.getHo() + " " + khach.getTen();
                sdtKhach = khach.getSodienthoai();
            } else {
                tenKhach = "Khách vãng lai";
                sdtKhach = "";
            }
        } else {
            tenKhach = (savedDonhang.getTenKhachLe() != null && !savedDonhang.getTenKhachLe().isBlank())
                    ? savedDonhang.getTenKhachLe() : "Khách vãng lai";
            sdtKhach = savedDonhang.getSdtKhachLe() != null ? savedDonhang.getSdtKhachLe() : "";
        }

        return donhangMapper.toDonhangResponse(savedDonhang, tenKhach, sdtKhach);
    }


    // --- 2. LẤY TẤT CẢ ĐƠN HÀNG ---
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public List<DonhangResponse> getAllDonhangs() {

        // ---- CACH 1 ----
        // Lấy danh sách entity từ DB
        // Đơn hàng mới nhất sẽ nằm đầu danh sách
        List<Donhang> listEntity = donhangRepository.findAllByOrderByNgaydatDesc();

        // Tạo một list rỗng để chứa kết quả
        List<DonhangResponse> responseList = new ArrayList<>();

        // Duyệt từng đơn hàng bằng vòng lặp
        for (Donhang donhang : listEntity) {
            String tenKhach;
            String sdtKhach;

            if (donhang.getIdthongtinkhachhang() != null) {
                Optional<Taikhoan> khachOpt = taikhoanRepository.findById(donhang.getIdthongtinkhachhang());
                if (khachOpt.isPresent()) {
                    Taikhoan khach = khachOpt.get();
                    tenKhach = khach.getHo() + " " + khach.getTen();
                    sdtKhach = khach.getSodienthoai();
                } else {
                    tenKhach = "Khách vãng lai";
                    sdtKhach = "";
                }
            } else {
                tenKhach = (donhang.getTenKhachLe() != null && !donhang.getTenKhachLe().isBlank())
                        ? donhang.getTenKhachLe() : "Khách vãng lai";
                sdtKhach = donhang.getSdtKhachLe() != null ? donhang.getSdtKhachLe() : "";
            }

            DonhangResponse response = donhangMapper.toDonhangResponse(donhang, tenKhach, sdtKhach);
            responseList.add(response);
        }
        return responseList;

        // ---- CACH 2 ----
//        return donhangRepository.findAllByOrderByNgaydatDesc().stream()
//                .map(donhang -> {
//                    String tenKhach = "Khách lẻ";
//                    String sdtKhach = "";
//                    if (donhang.getIdthongtinkhachhang() != null) {
//                        var khachOpt = taikhoanRepository.findById(donhang.getIdthongtinkhachhang());
//                        if (khachOpt.isPresent()) {
//                            var khach = khachOpt.get();
//                            tenKhach = khach.getHo() + " " + khach.getTen();
//                            sdtKhach = khach.getSodienthoai();
//                        }
//                    }
//                    return donhangMapper.toDonhangResponse(donhang, tenKhach, sdtKhach);
//                })
//                .collect(Collectors.toList());
    }

    // --- 3. LẤY CHI TIẾT ĐƠN HÀNG ---
    @PreAuthorize("isAuthenticated()")
    public List<ChitietDonhangResponse> getChiTietDonHang(String idDonhang) {
        Donhang donhang = donhangRepository.findById(idDonhang)
                .orElseThrow(() -> new AppExceptions(ErrorCode.DONHANG_NOT_EXISTED));

        //---- CACH 1 ----
        // Lấy list entity chi tiết
        List<Chitietdonhang> details = chitietdonhangRepository.findByIddonhang(donhang);

        // Tạo list rỗng để chứa kết quả
        List<ChitietDonhangResponse> responseList = new ArrayList<>();

        // Duyệt và map từng phần tử
        for (Chitietdonhang ct : details) {
            ChitietDonhangResponse response = donhangMapper.toChitietResponse(ct);
            responseList.add(response);
        }

        return responseList;

        //---- CACH 2 ----
//        return chitietdonhangRepository.findByIddonhang(donhang).stream()
//                .map(donhangMapper::toChitietResponse)
//                .collect(Collectors.toList());
    }

    // --- 4. XÁC NHẬN ĐÃ NHẬN HÀNG (khách sỉ tự xác nhận khi DANG_VAN_CHUYEN) ---
    @Transactional
    @PreAuthorize("hasAnyRole('CUSTOMER')")
    public DonhangResponse xacNhanNhanHang(String idDonhang) {
        Donhang donhang = donhangRepository.findById(idDonhang)
                .orElseThrow(() -> new AppExceptions(ErrorCode.DONHANG_NOT_EXISTED));

        if (donhang.getTrangthaidonhang() != TrangThaiDonHang.DANG_VAN_CHUYEN) {
            throw new AppExceptions(ErrorCode.ORDER_STATUS_INVALID, "Đơn hàng không ở trạng thái đang giao");
        }

        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        Taikhoan currentUser = taikhoanRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        if (!String.valueOf(currentUser.getIdtaikhoan()).equals(donhang.getIdthongtinkhachhang())) {
            throw new AppExceptions(ErrorCode.ACCESS_DENIED, "Bạn không có quyền xác nhận đơn hàng này");
        }

        donhang.setTrangthaidonhang(TrangThaiDonHang.GIAO_HANG_THANH_CONG);
        Donhang saved = donhangRepository.save(donhang);

        congNoService.xuLyDonGiaoThanhCong(saved, tinhTongTienDonHang(saved.getIddonhang()));

        return donhangMapper.toDonhangResponse(saved, currentUser.getHo() + " " + currentUser.getTen(), currentUser.getSodienthoai());
    }

    // --- 5. HỦY ĐƠN HÀNG (khách tự hủy khi còn CHO_XAC_NHAN) ---
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public DonhangResponse huyDonHang(String idDonhang) {
        Donhang donhang = donhangRepository.findById(idDonhang)
                .orElseThrow(() -> new AppExceptions(ErrorCode.DONHANG_NOT_EXISTED));

        if (donhang.getTrangthaidonhang() != TrangThaiDonHang.CHO_XAC_NHAN) {
            throw new AppExceptions(ErrorCode.ORDER_STATUS_INVALID, "Chỉ có thể hủy đơn hàng đang chờ xác nhận");
        }

        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        Taikhoan currentUser = taikhoanRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        if (!String.valueOf(currentUser.getIdtaikhoan()).equals(donhang.getIdthongtinkhachhang())) {
            throw new AppExceptions(ErrorCode.ACCESS_DENIED, "Bạn không có quyền hủy đơn hàng này");
        }

        // Không cần hoàn kho/lô gì cả: đơn còn CHO_XAC_NHAN nghĩa là chưa từng bị trừ kho (xem
        // createDonhang/updateStatus — kho/lô chỉ bị trừ khi đơn rời CHO_XAC_NHAN).
        donhang.setTrangthaidonhang(TrangThaiDonHang.HUY);
        Donhang saved = donhangRepository.save(donhang);
        return donhangMapper.toDonhangResponse(saved, currentUser.getHo() + " " + currentUser.getTen(), currentUser.getSodienthoai());
    }

    // --- 5. CẬP NHẬT TRẠNG THÁI (admin/staff) ---
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public DonhangResponse updateStatus(String id, TrangThaiDonHang newStatus) {
        Donhang donhang = donhangRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.DONHANG_NOT_EXISTED, "Không tìm thấy đơn hàng ID: " + id));

        TrangThaiDonHang oldStatus = donhang.getTrangthaidonhang();
        donhang.setTrangthaidonhang(newStatus);
        Donhang savedDonhang = donhangRepository.save(donhang);

        // Đơn rời CHO_XAC_NHAN qua đường admin xác nhận (COD/thanh toán sau) -> trừ kho/lô lúc này
        // (đơn VNPAY không đi qua đây để rời CHO_XAC_NHAN — callback thanh toán tự trừ trực tiếp
        // qua truSoluongTon(), không trừ trùng).
        if (oldStatus == TrangThaiDonHang.CHO_XAC_NHAN
                && newStatus != TrangThaiDonHang.CHO_XAC_NHAN
                && newStatus != TrangThaiDonHang.HUY) {
            for (Chitietdonhang ctdh : chitietdonhangRepository.findByIddonhang(savedDonhang)) {
                Chitietcaban kho = ctdh.getIdchitietcaban();
                BigDecimal luongCanTru = ctdh.getKhoiluongthucte() != null ? ctdh.getKhoiluongthucte() : BigDecimal.ZERO;
                if (luongCanTru.compareTo(BigDecimal.ZERO) <= 0) continue;

                if (kho.getSoluongton().compareTo(luongCanTru) < 0) {
                    throw new AppExceptions(ErrorCode.INVENTORY_NOT_ENOUGH, "Sản phẩm " + kho.getIdloaica().getTenloaica()
                            + " không đủ hàng! (Tồn: " + kho.getSoluongton() + ", Cần: " + luongCanTru + ")");
                }

                truLoFifo(kho, luongCanTru);
                kho.setSoluongton(kho.getSoluongton().subtract(luongCanTru));
                chitietcabanRepository.save(kho);
            }
        }

        // Admin có thể set thẳng GIAO_HANG_THANH_CONG ở đây, không chỉ qua xacNhanNhanHang() của khách
        if (newStatus == TrangThaiDonHang.GIAO_HANG_THANH_CONG && oldStatus != TrangThaiDonHang.GIAO_HANG_THANH_CONG) {
            congNoService.xuLyDonGiaoThanhCong(savedDonhang, tinhTongTienDonHang(savedDonhang.getIddonhang()));
        }

        return donhangMapper.toDonhangResponse(savedDonhang, null, null);
    }


    // Hàm tính tổng tiền (Có fallback tính lại nếu DB lưu thiếu)
    public BigDecimal tinhTongTienDonHang(String idDonHang) {
        Donhang donhang = donhangRepository.findById(idDonHang)
                .orElseThrow(() -> new AppExceptions(ErrorCode.DONHANG_NOT_EXISTED, "Không tìm thấy đơn hàng ID: " + idDonHang));

        List<Chitietdonhang> details = chitietdonhangRepository.findByIddonhang(donhang);

        BigDecimal tongTien = BigDecimal.ZERO;

        for (Chitietdonhang ct : details) {
            // Trường hợp 1: Trong DB đã có sẵn tổng tiền thực tế (Đơn mới)
            if (ct.getTongtienthucte() != null && ct.getTongtienthucte().compareTo(BigDecimal.ZERO) > 0) {
                tongTien = tongTien.add(ct.getTongtienthucte());
            }
            // Trường hợp 2: DB chưa có (Đơn cũ) -> Tính lại on-the-fly
            else {
                try {
                    // Lấy lại thông tin kho và đơn vị tính
                    Chitietcaban kho = ct.getIdchitietcaban();
                    Donvitinh dvtCt = ct.getIddonvitinh();

                    // Lấy giá đang áp dụng
                    Banggia banggia = banggiaRepository.findByChitietcabanAndNgayketthucIsNull(kho).orElse(null);

                    if (dvtCt != null && banggia != null) {
                        BigDecimal heSo;
                        if (dvtCt.getHesokg() != null && dvtCt.getHesokg().compareTo(BigDecimal.ZERO) > 0) {
                            heSo = dvtCt.getHesokg();
                        } else {
                            heSo = quydoiRepository.findByIdchitietcaban(kho)
                                    .map(Quydoi::getSokgtuongung)
                                    .orElse(BigDecimal.ONE);
                        }
                        BigDecimal gia = banggia.getGiabanle(); // Mặc định lấy giá lẻ cho an toàn

                        // Tính tiền: Số lượng * Hệ số * Giá
                        BigDecimal thanhTien = new BigDecimal(ct.getSoluong())
                                .multiply(heSo)
                                .multiply(gia);

                        tongTien = tongTien.add(thanhTien);
                    }
                } catch (Exception e) {
                    System.out.println("Lỗi tính lại tiền cho chi tiết ID: " + ct.getIdchitietdonhang());
                }
            }
        }

        return tongTien;
    }

//    @PreAuthorize("isAuthenticated()")
//    public List<DonhangResponse> getMyOrders() {
//        // 1. Lấy User hiện tại
//        var context = SecurityContextHolder.getContext();
//        String currentEmail = context.getAuthentication().getName();
//
//        Taikhoan currentUser = taikhoanRepository.findByEmail(currentEmail)
//                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
//
//        // 2. Lấy danh sách Entity
//        // Lưu ý: Đảm bảo bảng donhang lưu ID khách dạng String hay Int để gọi hàm find cho đúng
//        List<Donhang> myOrders = donhangRepository.findByIdthongtinkhachhang(String.valueOf(currentUser.getIdtaikhoan()));
//
//        List<DonhangResponse> responseList = new ArrayList<>();
//
//        // 3. Duyệt và map sang DTO
//        for (Donhang donhang : myOrders) {
//            // Map sang DTO trước
//            DonhangResponse response = donhangMapper.toDonhangResponse(donhang,
//                    currentUser.getHo() + " " + currentUser.getTen(),
//                    currentUser.getSodienthoai());
//
//            // 4. [QUAN TRỌNG] Tính tổng tiền và set vào DTO Response
//            // Vì Entity Donhang không có trường tongtien, nên ta set thẳng vào Response để trả về FE
//            BigDecimal calculatedTotal = tinhTongTienDonHang(donhang.getIddonhang());
//            response.setTongtien(calculatedTotal);
//
//            responseList.add(response);
//        }
//
//        // 5. Sắp xếp mới nhất lên đầu
//        responseList.sort((a, b) -> b.getNgaydat().compareTo(a.getNgaydat()));
//
//        return responseList;
//    }
    @PreAuthorize("isAuthenticated()")
    public List<DonhangResponse> getMyOrders() {
        // 1. Lấy User hiện tại
        var context = SecurityContextHolder.getContext();
        String currentEmail = context.getAuthentication().getName();

        Taikhoan currentUser = taikhoanRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        // 2. Lấy danh sách Entity Đơn hàng
        List<Donhang> myOrders = donhangRepository.findByIdthongtinkhachhang(String.valueOf(currentUser.getIdtaikhoan()));

        List<DonhangResponse> responseList = new ArrayList<>();

        // 3. Duyệt và map sang DTO
        for (Donhang donhang : myOrders) {
            // A. Map thông tin cơ bản sang DTO
            DonhangResponse response = donhangMapper.toDonhangResponse(donhang,
                    currentUser.getHo() + " " + currentUser.getTen(),
                    currentUser.getSodienthoai());

            // B. Tính tổng tiền (Logic cũ của bạn - Giữ nguyên)
            BigDecimal calculatedTotal = tinhTongTienDonHang(donhang.getIddonhang());
            response.setTongtien(calculatedTotal);

            // --- [MỚI] BỔ SUNG LẤY CHI TIẾT SẢN PHẨM ---

            // C.1 Tìm danh sách chi tiết của đơn hàng này từ DB
            List<Chitietdonhang> details = chitietdonhangRepository.findByIddonhang(donhang);

            // C.2 Map danh sách Entity -> Danh sách Response DTO (Dùng lại mapper bạn đã có)
            List<ChitietDonhangResponse> detailResponses = details.stream()
                    .map(donhangMapper::toChitietResponse)
                    .collect(Collectors.toList());

            // C.3 Gán danh sách chi tiết vào DonhangResponse (Cần đảm bảo DTO đã có trường này)
            response.setChiTietDonHangs(detailResponses);

            // -------------------------------------------

            responseList.add(response);
        }

        // 4. Sắp xếp mới nhất lên đầu
        responseList.sort((a, b) -> b.getNgaydat().compareTo(a.getNgaydat()));

        return responseList;
    }

    @Transactional
    public void truSoluongTon(String idDonhang) {
        // 1. Lấy thông tin đơn hàng (để làm tham số tìm kiếm)
        Donhang donhang = donhangRepository.findById(idDonhang)
                .orElseThrow(() -> new AppExceptions(ErrorCode.DONHANG_NOT_EXISTED, "Không tìm thấy đơn hàng: " + idDonhang));

        // 2. [THAY ĐỔI] Tìm danh sách chi tiết từ Repository của ChiTietDonHang
        List<Chitietdonhang> listChiTiet = chitietdonhangRepository.findByIddonhang(donhang);

        if (listChiTiet.isEmpty()) {
            // Trường hợp đơn hàng rỗng (hiếm gặp nhưng nên check)
            return;
        }

        // 3. Duyệt và trừ kho
        for (Chitietdonhang chitiet : listChiTiet) {
            Chitietcaban sanphamTrongKho = chitiet.getIdchitietcaban();

            // Lấy số lượng khách mua
            BigDecimal soLuongMua = BigDecimal.valueOf(chitiet.getSoluong());

            // Kiểm tra tồn kho
            if (sanphamTrongKho.getSoluongton().compareTo(soLuongMua) < 0) {
                throw new AppExceptions(ErrorCode.INVENTORY_NOT_ENOUGH, "Sản phẩm " + sanphamTrongKho.getIdloaica().getTenloaica() +
                        " (Size: " + sanphamTrongKho.getIdsizeca().getSizeca() + ") không đủ hàng!");
            }

            // Phân bổ trừ theo từng lô (FIFO) để biết lô nào còn lại bao nhiêu
            truLoFifo(sanphamTrongKho, soLuongMua);

            // Trừ và Lưu tồn kho tổng
            sanphamTrongKho.setSoluongton(sanphamTrongKho.getSoluongton().subtract(soLuongMua));
            chitietcabanRepository.save(sanphamTrongKho);
        }
    }

    // Trừ dần soluongconlai của các lô (Chitietphieunhap) thuộc sản phẩm kho này,
    // lô nhập trước (ngaynhap cũ hơn) bị trừ trước.
    private void truLoFifo(Chitietcaban sanphamTrongKho, BigDecimal soLuongCanTru) {
        List<Chitietphieunhap> danhSachLo = chitietphieunhapRepository
                .findByIdchitietcabanAndSoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(
                        sanphamTrongKho, BigDecimal.ZERO);

        BigDecimal conLai = soLuongCanTru;
        for (Chitietphieunhap lo : danhSachLo) {
            if (conLai.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal laySoLuong = lo.getSoluongconlai().min(conLai);
            lo.setSoluongconlai(lo.getSoluongconlai().subtract(laySoLuong));
            if (lo.getSoluongconlai().compareTo(BigDecimal.ZERO) == 0) {
                lo.setTrangthaica(TrangThaiCa.HET_HANG);
            }
            chitietphieunhapRepository.save(lo);

            conLai = conLai.subtract(laySoLuong);
        }

        if (conLai.compareTo(BigDecimal.ZERO) > 0) {
            throw new AppExceptions(ErrorCode.LO_KHONG_KHOP_TON_KHO, "Dữ liệu lô hàng của sản phẩm " + sanphamTrongKho.getIdloaica().getTenloaica() +
                    " (Size: " + sanphamTrongKho.getIdsizeca().getSizeca() +
                    ") không khớp với tồn kho tổng - thiếu " + conLai);
        }
    }

    // Hoàn trả vào lô khi cân thực tế nhẹ hơn dự kiến (xem updateThucTeDonHang) — ưu tiên hoàn vào lô
    // vừa bị trừ gần đây nhất (ngaynhap mới nhất trước, ngược lại với FIFO lúc trừ). Bỏ qua lô đã
    // THANH_LY vì phần đó là hao hụt đã chốt sổ, không phải hàng còn bán được.
    private void hoanTraLoFifo(Chitietcaban sanphamTrongKho, BigDecimal soLuongHoanTra) {
        List<Chitietphieunhap> danhSachLo = chitietphieunhapRepository
                .findByIdchitietcabanOrderByIdphieunhap_NgaynhapDesc(sanphamTrongKho);

        BigDecimal conLai = soLuongHoanTra;
        for (Chitietphieunhap lo : danhSachLo) {
            if (conLai.compareTo(BigDecimal.ZERO) <= 0) break;
            if (lo.getTrangthaica() == TrangThaiCa.THANH_LY) continue;
            if (lo.getSoluongnhap() == null || lo.getSoluongconlai() == null) continue;

            BigDecimal daTieuThu = lo.getSoluongnhap().subtract(lo.getSoluongconlai());
            if (daTieuThu.compareTo(BigDecimal.ZERO) <= 0) continue;

            BigDecimal traLai = daTieuThu.min(conLai);
            lo.setSoluongconlai(lo.getSoluongconlai().add(traLai));
            if (lo.getTrangthaica() == TrangThaiCa.HET_HANG) {
                lo.setTrangthaica(TrangThaiCa.CON_HANG);
            }
            chitietphieunhapRepository.save(lo);

            conLai = conLai.subtract(traLai);
        }

        // Hiếm khi xảy ra (chỉ khi lô đã lệch sẵn từ trước) — hoàn phần còn dư vào lô mới nhất
        // để không làm thất lạc số lượng, chấp nhận lô đó vượt nhẹ so với soluongnhap ban đầu.
        if (conLai.compareTo(BigDecimal.ZERO) > 0 && !danhSachLo.isEmpty()) {
            Chitietphieunhap loMoiNhat = danhSachLo.get(0);
            BigDecimal conLaiHienTai = loMoiNhat.getSoluongconlai() != null ? loMoiNhat.getSoluongconlai() : BigDecimal.ZERO;
            loMoiNhat.setSoluongconlai(conLaiHienTai.add(conLai));
            if (loMoiNhat.getTrangthaica() == TrangThaiCa.HET_HANG) {
                loMoiNhat.setTrangthaica(TrangThaiCa.CON_HANG);
            }
            chitietphieunhapRepository.save(loMoiNhat);
        }
    }

    // Chỉ đọc, không sửa gì: liệt kê kho tổng vs tổng lô còn hàng cho TỪNG sản phẩm, để xem trước
    // dữ liệu thực tế đang lệch theo hướng nào (lô cao hơn kho, hay ngược lại) trước khi quyết định
    // chạy dongBoLaiTonKhoTheoLo() hay xử lý tay. Sắp xếp theo độ lệch tuyệt đối giảm dần.
    public List<BaoCaoLechKhoResponse> baoCaoLechKho() {
        List<BaoCaoLechKhoResponse> ketQua = new ArrayList<>();

        for (Chitietcaban kho : chitietcabanRepository.findAll()) {
            BigDecimal tongLoConLai = chitietphieunhapRepository
                    .findByIdchitietcabanAndSoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(kho, BigDecimal.ZERO)
                    .stream()
                    .map(Chitietphieunhap::getSoluongconlai)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal khoThucTe = kho.getSoluongton() == null ? BigDecimal.ZERO : kho.getSoluongton();
            BigDecimal lech = tongLoConLai.subtract(khoThucTe);

            if (lech.compareTo(BigDecimal.ZERO) == 0) continue;

            ketQua.add(BaoCaoLechKhoResponse.builder()
                    .idchitietcaban(kho.getId())
                    .tenLoaiCa(kho.getIdloaica().getTenloaica())
                    .tenSize(kho.getIdsizeca().getSizeca())
                    .khoSoluongton(khoThucTe)
                    .tongLoConLai(tongLoConLai)
                    .lech(lech)
                    .coLoLichSu(chitietphieunhapRepository.existsByIdchitietcaban(kho))
                    .build());
        }

        ketQua.sort((a, b) -> b.getLech().abs().compareTo(a.getLech().abs()));
        return ketQua;
    }

    // Đối soát một lần: đưa lô (Chitietphieunhap.soluongconlai) khớp lại với kho tổng
    // (Chitietcaban.soluongton) cho dữ liệu cũ đã lệch trước khi có fix này — coi kho tổng là số đúng
    // (mọi đường trừ kho COD/online/thanh lý/cân thực tế đều đã trừ đúng kho tổng từ trước, chỉ có
    // COD/cân thực tế là quên trừ lô), rồi trừ phần lô dư ra theo FIFO để 2 bên khớp nhau.
    // Không tự suy luận lại nếu lô đang THẤP hơn kho (bất thường, trả về cảnh báo để xem tay).
    @Transactional
    public List<String> dongBoLaiTonKhoTheoLo() {
        List<String> canhBao = new ArrayList<>();

        for (Chitietcaban kho : chitietcabanRepository.findAll()) {
            BigDecimal tongLoConLai = chitietphieunhapRepository
                    .findByIdchitietcabanAndSoluongconlaiGreaterThanOrderByIdphieunhap_NgaynhapAsc(kho, BigDecimal.ZERO)
                    .stream()
                    .map(Chitietphieunhap::getSoluongconlai)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal khoThucTe = kho.getSoluongton() == null ? BigDecimal.ZERO : kho.getSoluongton();
            BigDecimal lech = tongLoConLai.subtract(khoThucTe);

            if (lech.compareTo(BigDecimal.ZERO) <= 0) continue;

            try {
                truLoFifo(kho, lech);
            } catch (RuntimeException e) {
                canhBao.add("Kho ID " + kho.getId() + " (" + kho.getIdloaica().getTenloaica() + " - "
                        + kho.getIdsizeca().getSizeca() + "): " + e.getMessage());
            }
        }

        return canhBao;
    }

    @Transactional
    public void updateThucTeDonHang(String idDonhang, List<UpdateCanNangRequest> listUpdates) {
        // 1. Kiểm tra đơn hàng
        Donhang donhang = donhangRepository.findById(idDonhang)
                .orElseThrow(() -> new AppExceptions(ErrorCode.DONHANG_NOT_EXISTED));

        // 2. Validate trạng thái
        if (donhang.getTrangthaidonhang() != TrangThaiDonHang.DANG_DONG_HANG) {
            throw new AppExceptions(ErrorCode.ORDER_STATUS_INVALID);
        }

        for (UpdateCanNangRequest request : listUpdates) {
            Chitietdonhang ctdh = chitietdonhangRepository.findById(request.getIdChitietdonhang())
                    .orElseThrow(() -> new AppExceptions(ErrorCode.CHITIET_DONHANG_NOT_EXISTED));

            if (!ctdh.getIddonhang().getIddonhang().equals(idDonhang)) continue;

            // Lấy số Kg mới từ Request
            BigDecimal slThucTeMoi = request.getSoluongkgthucte();

            // Lấy số Kg thực tế cũ (nếu đã từng nhập trước đó)
            BigDecimal slThucTeCu = ctdh.getKhoiluongthucte() != null ? ctdh.getKhoiluongthucte() : BigDecimal.ZERO;

            // --- A. CẬP NHẬT KHO (Quan trọng) ---
            Chitietcaban kho = ctdh.getIdchitietcaban();

            // Bước 1: Hoàn lại kho số lượng cũ (nếu có) để tránh trừ trùng
            if (slThucTeCu.compareTo(BigDecimal.ZERO) > 0) {
                kho.setSoluongton(kho.getSoluongton().add(slThucTeCu));
            }

            // Bước 2: Kiểm tra tồn kho có đủ cho số mới không
            if (kho.getSoluongton().compareTo(slThucTeMoi) < 0) {
                // Nếu muốn hiện chi tiết số lượng thiếu trong message, bạn cần constructor custom trong AppException
                // Ở đây dùng message mặc định của Enum: "So luong ton kho khong du..."
                throw new AppExceptions(ErrorCode.INVENTORY_NOT_ENOUGH);
            }

            // Bước 3: Trừ số lượng mới
            kho.setSoluongton(kho.getSoluongton().subtract(slThucTeMoi));
            chitietcabanRepository.save(kho);

            // Bước 4: Đồng bộ lại lô theo đúng phần chênh lệch (trước đây chỉ sửa kho tổng, không
            // đụng tới lô -> lô dần lệch khỏi kho mỗi khi cân thực tế khác dự kiến). Dương = thực tế
            // nặng hơn dự kiến -> trừ thêm vào lô (FIFO); âm = nhẹ hơn -> hoàn trả lại lô.
            BigDecimal chenhLech = slThucTeMoi.subtract(slThucTeCu);
            if (chenhLech.compareTo(BigDecimal.ZERO) > 0) {
                truLoFifo(kho, chenhLech);
            } else if (chenhLech.compareTo(BigDecimal.ZERO) < 0) {
                hoanTraLoFifo(kho, chenhLech.abs());
            }

            // --- B. CẬP NHẬT CHI TIẾT ĐƠN HÀNG ---
            ctdh.setKhoiluongthucte(slThucTeMoi);

            // Tính lại tiền (Dựa trên đơn giá gốc)
            BigDecimal donGia = BigDecimal.ZERO;
            if (ctdh.getKhoiluongdukien() != null && ctdh.getKhoiluongdukien().compareTo(BigDecimal.ZERO) > 0) {
                donGia = ctdh.getTongtiendukien().divide(ctdh.getKhoiluongdukien(), 2, RoundingMode.HALF_UP);
            }

            BigDecimal thanhTienMoi = slThucTeMoi.multiply(donGia);
            ctdh.setTongtienthucte(thanhTienMoi);

            chitietdonhangRepository.save(ctdh);
        }
    }
}
