package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.PhieunhapRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.PhieunhapResponse;
import com.minhquan.QuanLyVuaCa.service.PhieunhapService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Phieunhaps")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PhieunhapController {

    PhieunhapService phieunhapService;

    @GetMapping
    public ApiResponse<List<PhieunhapResponse>> getDanhSach() {
        return ApiResponse.<List<PhieunhapResponse>>builder()
                .code(200)
                .result(phieunhapService.getDanhSach())
                .build();
    }

    @PostMapping
    public ApiResponse<PhieunhapResponse> nhapHang(@RequestBody PhieunhapRequest request) {
        return ApiResponse.<PhieunhapResponse>builder()
                .code(200)
                .message("Nhập hàng thành công")
                .result(phieunhapService.nhapHang(request))
                .build();
    }

    @PatchMapping("/{id}/thanh-toan")
    public ApiResponse<Void> capNhatThanhToan(@PathVariable String id) {
        phieunhapService.capNhatThanhToan(id);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("Đã cập nhật trạng thái thanh toán")
                .build();
    }
}