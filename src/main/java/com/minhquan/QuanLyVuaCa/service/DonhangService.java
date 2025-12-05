package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.dto.request.ChitietDonhangRequest;
import com.minhquan.QuanLyVuaCa.dto.request.DonhangRequestCreation;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class DonhangService {

    DonhangRepository donhangRepository;
    ChitietdonhangRepository chitietdonhangRepository;
    ChitietcabanRepository chitietcabanRepository;
    DonvitinhRepository donvitinhRepository;
    // --- 1. TẠO ĐƠN HÀNG ---

    public Donhang createDonhang(DonhangRequestCreation request) {
        Donhang donhang = new Donhang();

        // Map đúng tên trường: idthongtinkhachhang
        donhang.setIdthongtinkhachhang(request.getIdthongtinkhachhang());

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

        // Lưu chi tiết
        if (request.getChiTietDonHang() != null && !request.getChiTietDonHang().isEmpty()) {
            List<Chitietdonhang> listChiTietEntity = new ArrayList<>();

            for (ChitietDonhangRequest itemReq : request.getChiTietDonHang()) {
                Chitietdonhang ct = new Chitietdonhang();
                ct.setIddonhang(savedDonhang);

                if (itemReq.getIdchitietcaban() != null) {
                    // Lưu ý: Đảm bảo input ID là số hay chuỗi tùy theo DB của bạn
                    // Nếu trong DB là Integer thì dùng parseInt, nếu là String thì để nguyên
                    try {
                        Integer idChiTiet = Integer.parseInt(itemReq.getIdchitietcaban());
                        Chitietcaban chitietcaban = chitietcabanRepository.findById(idChiTiet)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết cá bán ID: " + itemReq.getIdchitietcaban()));
                        ct.setIdchitietcaban(chitietcaban);
                    } catch (NumberFormatException e) {
                        throw new RuntimeException("ID chi tiết cá bán phải là số: " + itemReq.getIdchitietcaban());
                    }
                }

                if (itemReq.getIddonvitinh() != null) {
                    try {
                        Integer idDvt = Integer.parseInt(itemReq.getIddonvitinh());
                        Donvitinh donvitinh = donvitinhRepository.findById(idDvt)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn vị tính ID: " + itemReq.getIddonvitinh()));
                        ct.setIddonvitinh(donvitinh);
                    } catch (NumberFormatException e) {
                        throw new RuntimeException("ID đơn vị tính phải là số: " + itemReq.getIddonvitinh());
                    }
                }

                ct.setSoluong(itemReq.getSoluong());
                ct.setSoluongkgthucte(itemReq.getSoluongkgthucte());
                ct.setSoluongkgthuctequydoi(itemReq.getSoluongkgthuctequydoi());
                ct.setTongtiendukien(itemReq.getTongtiendukien());
                ct.setTongtienthucte(itemReq.getTongtienthucte());

                listChiTietEntity.add(ct);
            }
            chitietdonhangRepository.saveAll(listChiTietEntity);
        }

        return savedDonhang;
    }

    // --- 2. LẤY TẤT CẢ ĐƠN HÀNG ---
    public List<Donhang> getAllDonhangs() {
        return donhangRepository.findAllByOrderByNgaydatDesc();
    }

    // --- 3. CẬP NHẬT TRẠNG THÁI ---
    public Donhang updateStatus(String id, String status) {
        Donhang donhang = donhangRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + id));

        try {
            donhang.setTrangthaidonhang(TrangThaiDonHang.valueOf(status));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + status);
        }

        return donhangRepository.save(donhang);
    }
}