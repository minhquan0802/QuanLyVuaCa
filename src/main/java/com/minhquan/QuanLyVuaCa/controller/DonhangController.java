package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.DonhangRequestCreation;
import com.minhquan.QuanLyVuaCa.dto.request.DonhangStatusRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietDonhangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.DonhangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.service.DonhangService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Donhangs")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DonhangController {

    DonhangService donhangService;

    // API 1: Lấy danh sách đơn hàng (Có tên khách)
    @GetMapping
    public ApiResponse<List<DonhangResponse>> danhSachDonhangs() {
        return ApiResponse.<List<DonhangResponse>>builder()
                .code(200)
                .message("OK")
                .result(donhangService.getAllDonhangs())
                .build();
    }

    // API 2: Lấy chi tiết 1 đơn hàng (Có tên cá, size) -> Frontend đang gọi cái này
    @GetMapping("/{id}/chitiet")
    public ApiResponse<List<ChitietDonhangResponse>> layChiTiet(@PathVariable String id) {
        return ApiResponse.<List<ChitietDonhangResponse>>builder()
                .code(200)
                .message("OK")
                .result(donhangService.getChiTietDonHang(id))
                .build();
    }

    // API 3: Cập nhật trạng thái (Dùng @RequestBody để hứng JSON)
    @PutMapping("/{id}/status")
    public ApiResponse<DonhangResponse> capNhatTrangThai(
            @PathVariable String id,
            @RequestBody DonhangStatusRequest request) { // Sửa từ @RequestParam thành @RequestBody

        return ApiResponse.<DonhangResponse>builder()
                .code(200)
                .message("Cập nhật thành công")
                .result(donhangService.updateStatus(id, request.getTrangthaidonhang()))
                .build();
    }

    @PostMapping
    public ApiResponse<DonhangResponse> taoDonHang(@RequestBody DonhangRequestCreation request) {
        return ApiResponse.<DonhangResponse>builder()
                .code(200)
                .message("Đặt hàng thành công")
                .result(donhangService.createDonhang(request))
                .build();
    }
}