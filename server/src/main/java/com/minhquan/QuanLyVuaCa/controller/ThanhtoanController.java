package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.TaoBienBanThanhToanRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.TinhTrangThanhToanResponse;
import com.minhquan.QuanLyVuaCa.service.ThanhtoanService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/Thanhtoan")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ThanhtoanController {

    ThanhtoanService thanhtoanService;

    // Lấy tình trạng nợ/đã trả của đơn hàng
    @GetMapping("/{iddonhang}/tinh-trang")
    public ApiResponse<TinhTrangThanhToanResponse> getTinhTrang(@PathVariable String iddonhang) {
        return ApiResponse.<TinhTrangThanhToanResponse>builder()
                .code(200)
                .result(thanhtoanService.getTinhTrang(iddonhang))
                .build();
    }

    // Ghi nhận chuyển khoản (chờ admin xác nhận)
    @PostMapping("/chuyen-khoan")
    public ApiResponse<String> taoBienBanChuyenKhoan(@RequestBody TaoBienBanThanhToanRequest req) {
        thanhtoanService.taoBienBanChuyenKhoan(req.getIddonhang(), req.getSotien(), req.getGhichu());
        return ApiResponse.<String>builder()
                .code(200)
                .result("Đã ghi nhận chuyển khoản. Vui lòng chờ admin xác nhận.")
                .build();
    }

    // Admin xác nhận chuyển khoản hoặc thanh toán thủ công
    @PutMapping("/{idthanhtoan}/xac-nhan")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<String> xacNhanThanhToan(@PathVariable String idthanhtoan) {
        thanhtoanService.xacNhanThanhToan(idthanhtoan);
        return ApiResponse.<String>builder()
                .code(200)
                .result("Đã xác nhận thanh toán")
                .build();
    }
}
