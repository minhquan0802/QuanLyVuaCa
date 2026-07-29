package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.BanggiaRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.BanggiaResponse;
import com.minhquan.QuanLyVuaCa.service.BanggiaService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Banggias")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BanggiaController {

    BanggiaService banggiaService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BanggiaResponse> taoMoi(@RequestBody @Valid BanggiaRequest request) {
        return ApiResponse.<BanggiaResponse>builder()
                .result(banggiaService.taoMoi(request))
                .message("Thiết lập giá thành công")
                .build();
    }

    @GetMapping
    public ApiResponse<List<BanggiaResponse>> layTatCa() {
        return ApiResponse.<List<BanggiaResponse>>builder()
                .result(banggiaService.layTatCa())
                .build();
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<BanggiaResponse>> layLichSu() {
        return ApiResponse.<List<BanggiaResponse>>builder()
                .result(banggiaService.layLichSu())
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> xoa(@PathVariable Integer id) {
        banggiaService.xoa(id);
        return ApiResponse.<String>builder()
                .result("Đã ngừng áp dụng giá")
                .build();
    }
}
