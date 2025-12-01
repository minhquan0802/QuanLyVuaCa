package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.LoaicaCeationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.LoaicaUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LoaicaResponse;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.service.LoaicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
//    @PostMapping("/Loaicas")
//    private ApiResponse<LoaicaResponse> taoLoaica(@Validated @RequestBody LoaicaCeationRequest request) {
//        return ApiResponse.<LoaicaResponse>builder()
//                .code(200)
//                .message("Loai ca created")
//                .result(loaicaService.taoLoaica(request))
//                .build();
//    }
    // ======================== GET ONE ========================

    @PostMapping(value = "/Loaicas", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<LoaicaResponse> themLoaiCa(
            @RequestParam("tenloaica") String tenloaica,
            @RequestParam("mieuta") String mieuta,
            @RequestParam(value = "hinhanh", required = false) MultipartFile file) {

        LoaicaCeationRequest request = new LoaicaCeationRequest();
        request.setTenloaica(tenloaica);
        request.setMieuta(mieuta);
        request.setHinhanh(file);

        return ApiResponse.<LoaicaResponse>builder()
                .code(200)
                .message("OK")
                .result(loaicaService.taoLoaica(request))
                .build();
    }

    // ======================== UPDATE (ĐÃ SỬA) ========================
    @PutMapping(value = "/Loaicas/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    private ApiResponse<LoaicaResponse> capNhatLoaica(
            @PathVariable("id") Integer id,
            @RequestParam("tenloaica") String tenloaica,
            @RequestParam("mieuta") String mieuta,
            @RequestParam(value = "hinhanh", required = false) MultipartFile file) {

        // 1. Tạo đối tượng Request từ các tham số nhận được
        LoaicaUpdateRequest request = new LoaicaUpdateRequest();
        request.setTenloaica(tenloaica);
        request.setMieuta(mieuta);
        request.setHinhanh(file); // Nếu người dùng không gửi file, nó sẽ là null

        // 2. Gọi Service để xử lý (Service sẽ tự kiểm tra file có null hay không)
        return ApiResponse.<LoaicaResponse>builder()
                .code(200)
                .message("OK")
                .result(loaicaService.capNhatLoaica(id, request))
                .build();
    }




    @GetMapping("/Loaicas/{id}")
    private ApiResponse<LoaicaResponse> timLoaiCa(@PathVariable("id") Integer id) {
        return ApiResponse.<LoaicaResponse>builder()
                .code(200)
                .message("OK")
                .result(loaicaService.timLoaica(id))
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
