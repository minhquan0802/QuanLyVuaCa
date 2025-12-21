package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.dto.request.ChitietDonhangRequest;
import com.minhquan.QuanLyVuaCa.dto.request.DonhangRequestCreation;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietDonhangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.DonhangResponse;
import com.minhquan.QuanLyVuaCa.entity.*;
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
    DonvitinhRepository donvitinhRepository;
    TaiKhoanRepository taikhoanRepository;
    DonhangMapper donhangMapper;

// --- 1. TẠO ĐƠN HÀNG ---
//    @PreAuthorize("hasAnyRole('admin', 'nhanvienkho', 'nhanvien', 'nhanvienbanhang', 'khachle', 'khachsi')")
//    @Transactional
//    public DonhangResponse createDonhang(DonhangRequestCreation request) {
//
//    // 1. Map & Lưu đơn hàng cha
//    Donhang donhang = donhangMapper.toDonhang(request);
//
//    if (request.getNgaydat() != null) {
//        donhang.setNgaydat(request.getNgaydat());
//    } else {
//        donhang.setNgaydat(LocalDateTime.now());
//    }
//
//    if (request.getTrangthaidonhang() != null) {
//        donhang.setTrangthaidonhang(request.getTrangthaidonhang());
//    } else {
//        donhang.setTrangthaidonhang(TrangThaiDonHang.CHO_XAC_NHAN);
//    }
//
//    Donhang savedDonhang = donhangRepository.save(donhang);
//
//    // 2. Xử lý chi tiết đơn hàng
//    if (request.getChiTietDonHang() != null && !request.getChiTietDonHang().isEmpty()) {
//
//        // [QUAN TRỌNG] Khởi tạo List để chứa các chi tiết
//        List<Chitietdonhang> listChiTietEntity = new ArrayList<>();
//
//        for (ChitietDonhangRequest ctdhRequest : request.getChiTietDonHang()) {
//            // Map các trường cơ bản (số lượng, tổng tiền...)
//            Chitietdonhang ct = donhangMapper.toChitietEntity(ctdhRequest);
//            ct.setIddonhang(savedDonhang);
//
//            // Xử lý Chitietcaban (Kho)
//            if (ctdhRequest.getIdchitietcaban() != null) {
//                try {
//                    Integer idChiTiet = Integer.parseInt(ctdhRequest.getIdchitietcaban());
//                    Chitietcaban chitietcaban = chitietcabanRepository.findById(idChiTiet)
//                            .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm kho ID: " + ctdhRequest.getIdchitietcaban()));
//                    ct.setIdchitietcaban(chitietcaban);
//                } catch (NumberFormatException e) {
//                    throw new RuntimeException("ID chi tiết cá bán lỗi: " + ctdhRequest.getIdchitietcaban());
//                }
//            }
//
//            // Xử lý Đơn vị tính
//            if (ctdhRequest.getIddonvitinh() != null) {
//                try {
//                    Integer idDvt = Integer.parseInt(ctdhRequest.getIddonvitinh());
//                    Donvitinh donvitinh = donvitinhRepository.findById(idDvt)
//                            .orElseThrow(() -> new RuntimeException("Không tìm thấy ĐVT ID: " + ctdhRequest.getIddonvitinh()));
//                    ct.setIddonvitinh(donvitinh);
//                } catch (NumberFormatException e) {
//                    throw new RuntimeException("ID ĐVT lỗi: " + ctdhRequest.getIddonvitinh());
//                }
//            }
//
//            listChiTietEntity.add(ct);
//        }
//
//        if (!listChiTietEntity.isEmpty()) {
//            chitietdonhangRepository.saveAll(listChiTietEntity);
//        }
//    }
//
//    // 3. Chuẩn bị dữ liệu trả về
//    String tenKhach = "Khách lẻ";
//    String sdtKhach = "";
//    if (savedDonhang.getIdthongtinkhachhang() != null) {
//        var khachOpt = taikhoanRepository.findById(savedDonhang.getIdthongtinkhachhang());
//        if (khachOpt.isPresent()) {
//            var khach = khachOpt.get();
//            tenKhach = khach.getHo() + " " + khach.getTen();
//            sdtKhach = khach.getSodienthoai();
//        }
//    }
//
//    return donhangMapper.toDonhangResponse(savedDonhang, tenKhach, sdtKhach);
//}

    QuydoiRepository quydoiRepository;
    BanggiaRepository banggiaRepository;

//    @PreAuthorize("hasAnyRole('admin', 'nhanvienkho', 'nhanvien', 'nhanvienbanhang', 'khachle', 'khachsi')")
//    @Transactional
//    public DonhangResponse createDonhang(DonhangRequestCreation request) {
//
//        // 1. Map & Lưu đơn hàng cha
//        Donhang donhang = donhangMapper.toDonhang(request);
//
//        if (request.getNgaydat() != null) {
//            donhang.setNgaydat(request.getNgaydat());
//        } else {
//            donhang.setNgaydat(LocalDateTime.now());
//        }
//
//        if (request.getTrangthaidonhang() != null) {
//            donhang.setTrangthaidonhang(request.getTrangthaidonhang());
//        } else {
//            donhang.setTrangthaidonhang(TrangThaiDonHang.CHO_XAC_NHAN);
//        }
//
//        Donhang savedDonhang = donhangRepository.save(donhang);
//        BigDecimal tongTienDonHang = BigDecimal.ZERO;
//
//        // 2. Xử lý chi tiết đơn hàng
//        if (request.getChiTietDonHang() != null && !request.getChiTietDonHang().isEmpty()) {
//
//            List<Chitietdonhang> listChiTietEntity = new ArrayList<>();
//
//            for (ChitietDonhangRequest ctdhRequest : request.getChiTietDonHang()) {
//                Chitietdonhang ct = donhangMapper.toChitietEntity(ctdhRequest);
//                ct.setIddonhang(savedDonhang);
//
//                // --- A. Xử lý Chitietcaban (Sản phẩm kho) ---
//                Chitietcaban chitietcabanTemp = null; // Dùng biến tạm để xử lý logic
//                if (ctdhRequest.getIdchitietcaban() != null) {
//                    Integer idChiTiet = Integer.parseInt(ctdhRequest.getIdchitietcaban());
//                    chitietcabanTemp = chitietcabanRepository.findById(idChiTiet)
//                            .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm kho ID: " + ctdhRequest.getIdchitietcaban()));
//                    ct.setIdchitietcaban(chitietcabanTemp);
//                } else {
//                    throw new RuntimeException("Thiếu ID chi tiết cá bán (Sản phẩm kho)");
//                }
//
//                // [FIX LỖI LAMBDA]: Khai báo biến final để dùng trong lambda expression
//                Chitietcaban finalChitietcaban = chitietcabanTemp;
//
//                // --- B. Tính toán Tiền & Số lượng quy đổi ---
//
//                // B1. Lấy hệ số quy đổi (Dùng biến finalChitietcaban)
//                Quydoi quydoi = quydoiRepository.findByIdchitietcaban(finalChitietcaban)
//                        .orElseThrow(() -> new RuntimeException("Sản phẩm chưa cấu hình quy đổi kg (ID Kho: " + finalChitietcaban.getId() + ")"));
//
//                BigDecimal heSoQuyDoi = quydoi.getSokgtuongung();
//
//                // B2. Lấy giá bán hiện tại (Dùng hàm có sẵn của bạn)
//                Banggia banggia = banggiaRepository.findByChitietcabanAndNgayketthucIsNull(finalChitietcaban)
//                        .orElseThrow(() -> new RuntimeException("Sản phẩm chưa có bảng giá áp dụng (ID Kho: " + finalChitietcaban.getId() + ")"));
//
//                // B3. Xác định giá áp dụng (Sỉ hay Lẻ)
//                boolean isKhachSi = false;
//                if (savedDonhang.getIdthongtinkhachhang() != null) {
//                    var khach = taikhoanRepository.findById(savedDonhang.getIdthongtinkhachhang()).orElse(null);
//                    // Ví dụ: idvaitro=3 là Khách sỉ. Bạn hãy sửa số 3 này theo ID thật trong DB của bạn
//                    if (khach != null && khach.getIdvaitro() != null && khach.getIdvaitro().getId() == 3) {
//                        isKhachSi = true;
//                    }
//                }
//
//                BigDecimal donGiaApDung = isKhachSi ? banggia.getGiabansi() : banggia.getGiabanle();
//
//                // B4. Tính toán
//                BigDecimal soLuongDat = new BigDecimal(ct.getSoluong());
//                BigDecimal soLuongKgQuyDoi = soLuongDat.multiply(heSoQuyDoi);
//                BigDecimal thanhTienDuKien = soLuongKgQuyDoi.multiply(donGiaApDung);
//
//                // B5. Set ngược lại vào Entity
//                ct.setSoluongkgthuctequydoi(soLuongKgQuyDoi);
//                ct.setTongtiendukien(thanhTienDuKien);
//                ct.setTongtienthucte(thanhTienDuKien);
//
//                tongTienDonHang = tongTienDonHang.add(thanhTienDuKien);
//
//                // --- C. Xử lý Đơn vị tính ---
//                if (ctdhRequest.getIddonvitinh() != null) {
//                    Donvitinh donvitinh = donvitinhRepository.findById(Integer.parseInt(ctdhRequest.getIddonvitinh())).orElse(null);
//                    ct.setIddonvitinh(donvitinh);
//                } else {
//                    // Set mặc định ĐVT (ví dụ ID=1 là kg/con)
//                    Donvitinh defaultDvt = donvitinhRepository.findById(1).orElse(null);
//                    ct.setIddonvitinh(defaultDvt);
//                }
//
//                listChiTietEntity.add(ct);
//            }
//
//            if (!listChiTietEntity.isEmpty()) {
//                chitietdonhangRepository.saveAll(listChiTietEntity);
//            }
//        }
//
//        // 3. Chuẩn bị dữ liệu trả về
//        String tenKhach = "Khách lẻ";
//        String sdtKhach = "";
//        if (savedDonhang.getIdthongtinkhachhang() != null) {
//            var khachOpt = taikhoanRepository.findById(savedDonhang.getIdthongtinkhachhang());
//            if (khachOpt.isPresent()) {
//                var khach = khachOpt.get();
//                tenKhach = khach.getHo() + " " + khach.getTen();
//                sdtKhach = khach.getSodienthoai();
//            }
//        }
//
//
//
//        return donhangMapper.toDonhangResponse(savedDonhang, tenKhach, sdtKhach);
//    }

    @Transactional // Đảm bảo nếu lỗi trừ kho thì rollback cả đơn hàng
    public DonhangResponse createDonhang(DonhangRequestCreation request) {

        // 1. Map & Lưu đơn hàng cha
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

        // Lưu đơn hàng trước để có ID gán cho chi tiết
        Donhang savedDonhang = donhangRepository.save(donhang);
        BigDecimal tongTienDonHang = BigDecimal.ZERO;

        // Kiểm tra xem đơn này có phải COD không (dựa vào ghi chú từ Frontend gửi lên)
        boolean isCOD = request.getGhichu() != null && request.getGhichu().toUpperCase().contains("[COD]");

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
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm kho ID: " + ctdhRequest.getIdchitietcaban()));
                } else {
                    throw new RuntimeException("Thiếu ID chi tiết cá bán (Sản phẩm kho)");
                }
                ct.setIdchitietcaban(chitietcabanTemp);
                // Biến final để dùng trong lambda hoặc tính toán sau này
                Chitietcaban finalChitietcaban = chitietcabanTemp;

                // --- B. Tính toán Tiền & Số lượng quy đổi ---

                // B1. Lấy hệ số quy đổi
                Quydoi quydoi = quydoiRepository.findByIdchitietcaban(finalChitietcaban)
                        .orElseThrow(() -> new RuntimeException("Sản phẩm chưa cấu hình quy đổi kg (ID Kho: " + finalChitietcaban.getId() + ")"));

                BigDecimal heSoQuyDoi = quydoi.getSokgtuongung();

                // B2. Lấy giá bán hiện tại
                Banggia banggia = banggiaRepository.findByChitietcabanAndNgayketthucIsNull(finalChitietcaban)
                        .orElseThrow(() -> new RuntimeException("Sản phẩm chưa có bảng giá áp dụng (ID Kho: " + finalChitietcaban.getId() + ")"));

                // B3. Xác định giá áp dụng (Sỉ hay Lẻ)
                boolean isKhachSi = false;
                if (savedDonhang.getIdthongtinkhachhang() != null) {
                    var khach = taikhoanRepository.findById(savedDonhang.getIdthongtinkhachhang()).orElse(null);
                    // Ví dụ: idvaitro=5 là Khách sỉ (Check lại ID trong DB của bạn)
                    if (khach != null && khach.getIdvaitro() != null && khach.getIdvaitro().getId() == 5) {
                        isKhachSi = true;
                    }
                }

                BigDecimal donGiaApDung = isKhachSi ? banggia.getGiabansi() : banggia.getGiabanle();

                // B4. Tính toán
                BigDecimal soLuongDat = new BigDecimal(ct.getSoluong());
                BigDecimal soLuongKgQuyDoi = soLuongDat.multiply(heSoQuyDoi);
                BigDecimal thanhTienDuKien = soLuongKgQuyDoi.multiply(donGiaApDung);

                // B5. Set ngược lại vào Entity
                ct.setSoluongkgthuctequydoi(soLuongKgQuyDoi);
                ct.setTongtiendukien(thanhTienDuKien);
                ct.setTongtienthucte(thanhTienDuKien); // Tạm thời thực tế = dự kiến

                tongTienDonHang = tongTienDonHang.add(thanhTienDuKien);

                // --- C. TRỪ TỒN KHO NẾU LÀ COD ---
                if (isCOD) {
                    // Xác định lượng cần trừ: Trừ theo "Số lượng đặt" hay "Số Kg"?
                    // Tùy nghiệp vụ của bạn. Ở đây mình trừ theo Số lượng đặt (Con/Bao...)
//                    BigDecimal luongCanTru = soLuongDat;

                    // Nếu kho bạn quản lý theo Kg, hãy đổi dòng trên thành:
                     BigDecimal luongCanTru = soLuongKgQuyDoi;

                    if (finalChitietcaban.getSoluongton().compareTo(luongCanTru) < 0) {
                        throw new RuntimeException("Sản phẩm " + finalChitietcaban.getIdloaica().getTenloaica()
                                + " không đủ hàng! (Tồn: " + finalChitietcaban.getSoluongton() + ", Đặt: " + luongCanTru + ")");
                    }

                    // Trừ và Cập nhật lại kho ngay lập tức
                    finalChitietcaban.setSoluongton(finalChitietcaban.getSoluongton().subtract(luongCanTru));
                    chitietcabanRepository.save(finalChitietcaban);
                }

                // --- D. Xử lý Đơn vị tính ---
                if (ctdhRequest.getIddonvitinh() != null) {
                    Donvitinh donvitinh = donvitinhRepository.findById(Integer.parseInt(ctdhRequest.getIddonvitinh())).orElse(null);
                    ct.setIddonvitinh(donvitinh);
                } else {
                    Donvitinh defaultDvt = donvitinhRepository.findById(1).orElse(null);
                    ct.setIddonvitinh(defaultDvt);
                }

                listChiTietEntity.add(ct);
            }

            if (!listChiTietEntity.isEmpty()) {
                chitietdonhangRepository.saveAll(listChiTietEntity);
            }
        }

        // Cập nhật tổng tiền vào đơn hàng cha (nếu cần thiết)
        // savedDonhang.setTongtien(tongTienDonHang);
        // donhangRepository.save(savedDonhang);

        // 3. Chuẩn bị dữ liệu trả về
        String tenKhach = "Khách lẻ";
        String sdtKhach = "";
        if (savedDonhang.getIdthongtinkhachhang() != null) {
            var khachOpt = taikhoanRepository.findById(savedDonhang.getIdthongtinkhachhang());
            if (khachOpt.isPresent()) {
                var khach = khachOpt.get();
                tenKhach = khach.getHo() + " " + khach.getTen();
                sdtKhach = khach.getSodienthoai();
            }
        }

        return donhangMapper.toDonhangResponse(savedDonhang, tenKhach, sdtKhach);
    }



    // --- 2. LẤY TẤT CẢ ĐƠN HÀNG ---
    @PreAuthorize("hasAnyRole('admin', 'nhanvienkho', 'nhanvien', 'nhanvienbanhang')")
    public List<DonhangResponse> getAllDonhangs() {

        // ---- CACH 1 ----
        // Lấy danh sách entity từ DB
        List<Donhang> listEntity = donhangRepository.findAllByOrderByNgaydatDesc();

        // Tạo một list rỗng để chứa kết quả
        List<DonhangResponse> responseList = new ArrayList<>();

        // Duyệt từng đơn hàng bằng vòng lặp
        for (Donhang donhang : listEntity) {
            String tenKhach = "Khách lẻ";
            String sdtKhach = "";

            // Tìm thông tin khách hàng
            if (donhang.getIdthongtinkhachhang() != null) {
                Optional<Taikhoan> khachOpt = taikhoanRepository.findById(donhang.getIdthongtinkhachhang());
                if (khachOpt.isPresent()) {
                    Taikhoan khach = khachOpt.get();
                    tenKhach = khach.getHo() + " " + khach.getTen();
                    sdtKhach = khach.getSodienthoai();
                }
            }

            // Map sang Response và thêm vào list kết quả
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
    // Cho phép xem chi tiết (có thể cần logic check chủ sở hữu đơn hàng nếu là khách)
    @PreAuthorize("hasAnyRole('admin', 'nhanvienkho', 'nhanvien', 'nhanvienbanhang', 'khachle', 'khachsi')")
    public List<ChitietDonhangResponse> getChiTietDonHang(String idDonhang) {
        Donhang donhang = donhangRepository.findById(idDonhang)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

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

    // --- 4. CẬP NHẬT TRẠNG THÁI ---
    // Chỉ Admin và nhân viên bán hàng được duyệt đơn/đổi trạng thái
    @PreAuthorize("hasAnyRole('admin', 'nhanvienbanhang')")
    public DonhangResponse updateStatus(String id, TrangThaiDonHang newStatus) {
        Donhang donhang = donhangRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + id));

        donhang.setTrangthaidonhang(newStatus);
        Donhang savedDonhang = donhangRepository.save(donhang);

        return donhangMapper.toDonhangResponse(savedDonhang, null, null);
    }


    // [CẬP NHẬT] Hàm tính tổng tiền (Có fallback tính lại nếu DB lưu thiếu)
    public BigDecimal tinhTongTienDonHang(String idDonHang) {
        Donhang donhang = donhangRepository.findById(idDonHang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + idDonHang));

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
                    // Lấy lại thông tin kho và quy đổi
                    Chitietcaban kho = ct.getIdchitietcaban();
                    Quydoi quydoi = quydoiRepository.findByIdchitietcaban(kho).orElse(null);

                    // Lấy giá đang áp dụng
                    Banggia banggia = banggiaRepository.findByChitietcabanAndNgayketthucIsNull(kho).orElse(null);

                    if (quydoi != null && banggia != null) {
                        BigDecimal heSo = quydoi.getSokgtuongung();
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

    @PreAuthorize("isAuthenticated()")
    public List<DonhangResponse> getMyOrders() {
        // 1. Lấy User hiện tại
        var context = SecurityContextHolder.getContext();
        String currentEmail = context.getAuthentication().getName();

        Taikhoan currentUser = taikhoanRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // 2. Lấy danh sách Entity
        // Lưu ý: Đảm bảo bảng donhang lưu ID khách dạng String hay Int để gọi hàm find cho đúng
        List<Donhang> myOrders = donhangRepository.findByIdthongtinkhachhang(String.valueOf(currentUser.getIdtaikhoan()));

        List<DonhangResponse> responseList = new ArrayList<>();

        // 3. Duyệt và map sang DTO
        for (Donhang donhang : myOrders) {
            // Map sang DTO trước
            DonhangResponse response = donhangMapper.toDonhangResponse(donhang,
                    currentUser.getHo() + " " + currentUser.getTen(),
                    currentUser.getSodienthoai());

            // 4. [QUAN TRỌNG] Tính tổng tiền và set vào DTO Response
            // Vì Entity Donhang không có trường tongtien, nên ta set thẳng vào Response để trả về FE
            BigDecimal calculatedTotal = tinhTongTienDonHang(donhang.getIddonhang());
            response.setTongtien(calculatedTotal);

            responseList.add(response);
        }

        // 5. Sắp xếp mới nhất lên đầu
        responseList.sort((a, b) -> b.getNgaydat().compareTo(a.getNgaydat()));

        return responseList;
    }

    @Transactional
    public void truSoluongTon(String idDonhang) {
        // 1. Lấy thông tin đơn hàng (để làm tham số tìm kiếm)
        Donhang donhang = donhangRepository.findById(idDonhang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + idDonhang));

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
                throw new RuntimeException("Sản phẩm " + sanphamTrongKho.getIdloaica().getTenloaica() +
                        " (Size: " + sanphamTrongKho.getIdsizeca().getSizeca() + ") không đủ hàng!");
            }

            // Trừ và Lưu
            sanphamTrongKho.setSoluongton(sanphamTrongKho.getSoluongton().subtract(soLuongMua));
            chitietcabanRepository.save(sanphamTrongKho);
        }
    }
}


