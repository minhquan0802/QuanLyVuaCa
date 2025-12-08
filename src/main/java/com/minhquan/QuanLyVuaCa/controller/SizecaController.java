package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.SizecaRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.SizecaResponse;
import com.minhquan.QuanLyVuaCa.service.SizecaService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Sizecas")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // Cho phép FE gọi
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SizecaController {
    SizecaService sizecaService;

    // API: Lấy danh sách size theo ID loại cá
    // URL: /Sizecas/loaica/{id}
    @GetMapping("/loaica/{id}")
    public ApiResponse<List<SizecaResponse>> getSizeByLoaiCa(@PathVariable Integer id) {
        return ApiResponse.<List<SizecaResponse>>builder()
                .code(200)
                .message("OK")
                .result(sizecaService.getSizeByLoaiCa(id))
                .build();
    }

    // API: Thêm size mới
    // URL: /Sizecas (POST)
    @PostMapping
    public ApiResponse<SizecaResponse> createSize(@RequestBody SizecaRequest request) {
        return ApiResponse.<SizecaResponse>builder()
                .code(200)
                .message("Thêm size thành công")
                .result(sizecaService.createSize(request))
                .build();
    }

    // API: Xóa size
    // URL: /Sizecas/{id} (DELETE)
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteSize(@PathVariable Integer id) {
        sizecaService.deleteSize(id);
        return ApiResponse.<String>builder()
                .code(200)
                .message("Đã xóa size")
                .result("Deleted")
                .build();
    }
}