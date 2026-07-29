package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.LoaicaCeationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.LoaicaUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LoaicaResponse;
import com.minhquan.QuanLyVuaCa.service.LoaicaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/Loaicas")
@RequiredArgsConstructor
public class LoaicaController {
    private final LoaicaService loaicaService;

    @GetMapping
    public ApiResponse<List<LoaicaResponse>> danhSachLoaiCa() {
        return ApiResponse.<List<LoaicaResponse>>builder()
                .code(200)
                .message("OK")
                .result(loaicaService.layLoaiCa())
                .build();
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<LoaicaResponse>> danhSachLoaiCaChoAdmin() {
        return ApiResponse.<List<LoaicaResponse>>builder()
                .code(200)
                .message("OK")
                .result(loaicaService.layTatCaLoaiCa())
                .build();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<LoaicaResponse> themLoaiCa(
            @Valid @ModelAttribute LoaicaCeationRequest request) {
        return ApiResponse.<LoaicaResponse>builder()
                .code(200)
                .message("OK")
                .result(loaicaService.taoLoaica(request))
                .build();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<LoaicaResponse> capNhatLoaica(
            @PathVariable("id") Integer id,
            @Valid @ModelAttribute LoaicaUpdateRequest request) {
        return ApiResponse.<LoaicaResponse>builder()
                .code(200)
                .message("OK")
                .result(loaicaService.capNhatLoaica(id, request))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<LoaicaResponse> timLoaica(@PathVariable("id") Integer id) {
        return ApiResponse.<LoaicaResponse>builder()
                .code(200)
                .message("OK")
                .result(loaicaService.timLoaica(id))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> xoaLoaica(@PathVariable("id") Integer id) {
        loaicaService.xoaLoaica(id);
        return ApiResponse.<String>builder()
                .code(200)
                .message("OK")
                .result("Đã ngừng bán loại cá")
                .build();
    }

    @PatchMapping("/{id}/khoi-phuc")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> khoiPhucLoaica(@PathVariable("id") Integer id) {
        loaicaService.khoiPhucLoaica(id);
        return ApiResponse.<String>builder()
                .code(200)
                .message("OK")
                .result("Đã mở lại loại cá; vui lòng thiết lập bảng giá mới")
                .build();
    }
}
