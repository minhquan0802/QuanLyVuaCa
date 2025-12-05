package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.minhquan.QuanLyVuaCa.service.TaiKhoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class TaiKhoanController {
    @Autowired
    private TaiKhoanService taiKhoanService;

    @PostMapping("/TaiKhoans")
    private ApiResponse<TaikhoanResponse> taoTaikhoan(@RequestBody TaiKhoanCreationRequest request){
        return ApiResponse.<TaikhoanResponse>builder()
                .code(200)
                .message("TaiKhoan created")
                .result(taiKhoanService.taoTaiKhoan(request))
                .build();
    }

    @GetMapping("/TaiKhoans")
    private ApiResponse<List<TaikhoanResponse>> danhSachTaiKhoan(){
        return ApiResponse.<List<TaikhoanResponse>>builder()
                .code(200)
                .message("OK")
                .result(taiKhoanService.getTaiKhoans())
                .build();
    }

    @GetMapping("/TaiKhoans/{idtaikhoan}")
    private ApiResponse<TaikhoanResponse> timTaiKhoan(@PathVariable("idtaikhoan") String userId) {
        return ApiResponse.<TaikhoanResponse>builder()
                .code(200)
                .message("OK")
                .result(taiKhoanService.timTaiKhoan(userId))
                .build();
    }

    @PutMapping("/TaiKhoans/{idtaikhoan}")
    private ApiResponse<TaikhoanResponse> updateUser(@PathVariable("idtaikhoan") String idtaikhoan, @RequestBody TaiKhoanUpdateRequest request){
        return ApiResponse.<TaikhoanResponse>builder()
                .code(200)
                .message("OK")
                .result(taiKhoanService.updateTaiKhoan(idtaikhoan,request))
                .build();
    }
    @DeleteMapping("/TaiKhoans/{idtaikhoan}")
    private ApiResponse<String> xoaTK(@PathVariable("idtaikhoan") String idtaikhoan){
        taiKhoanService.xoaTaiKhoan(idtaikhoan);
        return ApiResponse.<String>builder()
                .result("Da xoa user")
                .build();
    }
}
