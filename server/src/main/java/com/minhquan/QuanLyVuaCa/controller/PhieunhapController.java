package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.PhieunhapRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.PhieunhapResponse;
import com.minhquan.QuanLyVuaCa.service.PhieunhapService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/Phieunhaps")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PhieunhapController {

    PhieunhapService phieunhapService;

    @PostMapping
    public ApiResponse<PhieunhapResponse> nhapHang(@RequestBody PhieunhapRequest request) {
        return ApiResponse.<PhieunhapResponse>builder()
                .code(200)
                .message("Nhập hàng thành công")
                .result(phieunhapService.nhapHang(request))
                .build();
    }
}