package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.CapNhatSoLuongRequest;
import com.minhquan.QuanLyVuaCa.dto.request.ThemVaoGioHangRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.GioHangResponse;
import com.minhquan.QuanLyVuaCa.service.GioHangService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/gio-hang")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GioHangController {

    GioHangService gioHangService;

    @GetMapping
    public ApiResponse<GioHangResponse> layGioHang() {
        return ApiResponse.<GioHangResponse>builder()
                .code(200)
                .message("OK")
                .result(gioHangService.layGioHang())
                .build();
    }

    @PostMapping("/items")
    public ApiResponse<GioHangResponse> themSanPham(@Valid @RequestBody ThemVaoGioHangRequest request) {
        return ApiResponse.<GioHangResponse>builder()
                .code(200)
                .message("Đã thêm vào giỏ hàng")
                .result(gioHangService.themSanPham(request))
                .build();
    }

    @PutMapping("/items/{id}")
    public ApiResponse<GioHangResponse> capNhatSoLuong(
            @PathVariable String id,
            @Valid @RequestBody CapNhatSoLuongRequest request) {
        return ApiResponse.<GioHangResponse>builder()
                .code(200)
                .message("Đã cập nhật")
                .result(gioHangService.capNhatSoLuong(id, request))
                .build();
    }

    @DeleteMapping("/items/{id}")
    public ApiResponse<GioHangResponse> xoaSanPham(@PathVariable String id) {
        return ApiResponse.<GioHangResponse>builder()
                .code(200)
                .message("Đã xóa")
                .result(gioHangService.xoaSanPham(id))
                .build();
    }

    @DeleteMapping
    public ApiResponse<String> xoaToGioHang() {
        gioHangService.xoaToGioHang();
        return ApiResponse.<String>builder()
                .code(200)
                .message("Đã xóa toàn bộ giỏ hàng")
                .build();
    }
}
