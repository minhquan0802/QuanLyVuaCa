package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.LoaicaCeationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.LoaicaUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LoaicaResponse;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.service.LoaicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class LoaicaController {
    @Autowired
    private LoaicaService loaicaService;


    @GetMapping("/Loaicas")
    ApiResponse<List<LoaicaResponse>> danhSachLoaiCa(){
        return ApiResponse.<List<LoaicaResponse>>builder()
                .code(200)
                .message("OK")
                .result(loaicaService.getLoaiCa())
                .build();
    }
    // ======================== CREATE ========================
    @PostMapping("/Loaicas")
    private ApiResponse<LoaicaResponse> taoLoaica(@Validated @RequestBody LoaicaCeationRequest request) {
        return ApiResponse.<LoaicaResponse>builder()
                .code(200)
                .message("Loai ca created")
                .result(loaicaService.taoLoaica(request))
                .build();
    }
    // ======================== GET ONE ========================
    @GetMapping("/Loaicas/{id}")
    private ApiResponse<LoaicaResponse> timLoaiCa(@PathVariable("id") Integer id) {
        return ApiResponse.<LoaicaResponse>builder()
                .code(200)
                .message("OK")
                .result(loaicaService.timLoaica(id))
                .build();
    }

    // ======================== UPDATE ========================
    @PutMapping("/Loaicas/{id}")
    private ApiResponse<LoaicaResponse> capNhatLoaica(
            @PathVariable("id") Integer id,
            @RequestBody LoaicaUpdateRequest request) {

        return ApiResponse.<LoaicaResponse>builder()
                .code(200)
                .message("OK")
                .result(loaicaService.capNhatLoaica(id, request))
                .build();
    }

    // ======================== DELETE ========================
    @DeleteMapping("/Loaicas/{id}")
    private ApiResponse<String> xoaLoaica(@PathVariable("id") Integer id) {
        loaicaService.xoaLoaica(id);

        return ApiResponse.<String>builder()
                .code(200)
                .message("OK")
                .result("Đã xóa loại cá")
                .build();
    }
}
