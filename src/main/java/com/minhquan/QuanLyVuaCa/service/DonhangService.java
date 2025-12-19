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
//        //Map từ Request sang Entity
//        Donhang donhang = donhangMapper.toDonhang(request);
//
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
//        // 3. Lưu đơn hàng cha
//        Donhang savedDonhang = donhangRepository.save(donhang);
//
//        // 4. Xử lý chi tiết đơn hàng (Thủ công tìm ID liên kết)
//        if (request.getChiTietDonHang() != null && !request.getChiTietDonHang().isEmpty()) {
//            List<Chitietdonhang> listChiTietEntity = new ArrayList<>();
//
//            for (ChitietDonhangRequest ctdhRequest : request.getChiTietDonHang()) {
//                // Map các trường cơ bản (số lượng, tiền...)
//                Chitietdonhang ct = donhangMapper.toChitietEntity(ctdhRequest);
//                ct.setIddonhang(savedDonhang);
//
//                // --- Xử lý Chitietcaban ---
//                if (ctdhRequest.getIdchitietcaban() != null) {
//                    try {
//                        Integer idChiTiet = Integer.parseInt(ctdhRequest.getIdchitietcaban());
//                        Chitietcaban chitietcaban = chitietcabanRepository.findById(idChiTiet)
//                                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết cá bán ID: " + ctdhRequest.getIdchitietcaban()));
//                        ct.setIdchitietcaban(chitietcaban);
//                    } catch (NumberFormatException e) {
//                        throw new RuntimeException("ID chi tiết cá bán phải là số: " + ctdhRequest.getIdchitietcaban());
//                    }
//                }
//
//                // --- Xử lý Donvitinh ---
//                if (ctdhRequest.getIddonvitinh() != null) {
//                    try {
//                        Integer idDvt = Integer.parseInt(ctdhRequest.getIddonvitinh());
//                        Donvitinh donvitinh = donvitinhRepository.findById(idDvt)
//                                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn vị tính ID: " + ctdhRequest.getIddonvitinh()));
//                        ct.setIddonvitinh(donvitinh);
//                    } catch (NumberFormatException e) {
//                        throw new RuntimeException("ID đơn vị tính phải là số: " + ctdhRequest.getIddonvitinh());
//                    }
//                }
//
//                listChiTietEntity.add(ct);
//            }
//            chitietdonhangRepository.saveAll(listChiTietEntity);
//        }
//
//        // 5. Chuẩn bị dữ liệu trả về (Lấy tên khách hàng)
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
//        return donhangMapper.toDonhangResponse(savedDonhang, tenKhach, sdtKhach);
//    }

// --- 1. TẠO ĐƠN HÀNG ---
    @PreAuthorize("hasAnyRole('admin', 'nhanvienkho', 'nhanvien', 'nhanvienbanhang', 'khachle', 'khachsi')")
    @Transactional
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

    Donhang savedDonhang = donhangRepository.save(donhang);

    // 2. Xử lý chi tiết đơn hàng
    if (request.getChiTietDonHang() != null && !request.getChiTietDonHang().isEmpty()) {

        // [QUAN TRỌNG] Khởi tạo List để chứa các chi tiết
        List<Chitietdonhang> listChiTietEntity = new ArrayList<>();

        for (ChitietDonhangRequest ctdhRequest : request.getChiTietDonHang()) {
            // Map các trường cơ bản (số lượng, tổng tiền...)
            Chitietdonhang ct = donhangMapper.toChitietEntity(ctdhRequest);
            ct.setIddonhang(savedDonhang);

            // --- BỎ ĐOẠN TÍNH setDongia VÌ ENTITY KHÔNG CÓ TRƯỜNG NÀY ---
            // Dữ liệu 'dongia' sẽ được Mapper tự tính toán khi READ (Xem chi tiết)
            // chứ không phải khi WRITE (Tạo đơn).
            // -------------------------------------------------------------

            // Xử lý Chitietcaban (Kho)
            if (ctdhRequest.getIdchitietcaban() != null) {
                try {
                    Integer idChiTiet = Integer.parseInt(ctdhRequest.getIdchitietcaban());
                    Chitietcaban chitietcaban = chitietcabanRepository.findById(idChiTiet)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm kho ID: " + ctdhRequest.getIdchitietcaban()));
                    ct.setIdchitietcaban(chitietcaban);
                } catch (NumberFormatException e) {
                    throw new RuntimeException("ID chi tiết cá bán lỗi: " + ctdhRequest.getIdchitietcaban());
                }
            }

            // Xử lý Đơn vị tính
            if (ctdhRequest.getIddonvitinh() != null) {
                try {
                    Integer idDvt = Integer.parseInt(ctdhRequest.getIddonvitinh());
                    Donvitinh donvitinh = donvitinhRepository.findById(idDvt)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy ĐVT ID: " + ctdhRequest.getIddonvitinh()));
                    ct.setIddonvitinh(donvitinh);
                } catch (NumberFormatException e) {
                    throw new RuntimeException("ID ĐVT lỗi: " + ctdhRequest.getIddonvitinh());
                }
            }

            // Thêm vào list
            listChiTietEntity.add(ct);
        }

        // [QUAN TRỌNG] Lưu tất cả chi tiết xuống DB
        if (!listChiTietEntity.isEmpty()) {
            chitietdonhangRepository.saveAll(listChiTietEntity);
        }
    }

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
}