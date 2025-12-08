package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.minhquan.QuanLyVuaCa.service.TaiKhoanService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/TaiKhoans")
@CrossOrigin(origins = "http://localhost:3000")
public class TaiKhoanController {
    @Autowired
    private TaiKhoanService taiKhoanService;

    @PostMapping
    private ApiResponse<TaikhoanResponse> taoTaikhoan(@Valid @RequestBody TaiKhoanCreationRequest request){
        return ApiResponse.<TaikhoanResponse>builder()
                .code(200)
                .message("TaiKhoan created")
                .result(taiKhoanService.taoTaiKhoan(request))
                .build();
    }

    @GetMapping
    private ApiResponse<List<TaikhoanResponse>> danhSachTaiKhoan(){
//        var authentication = SecurityContextHolder.getContext().getAuthentication();
//        log.info("Username : {}", authentication.getName());
//        authentication.getAuthorities().forEach(grantedAuthority -> log.info(grantedAuthority.toString()));

        return ApiResponse.<List<TaikhoanResponse>>builder()
                .code(200)
                .message("OK")
                .result(taiKhoanService.getTaiKhoans())
                .build();
    }

    @GetMapping("/{idtaikhoan}")
    private ApiResponse<TaikhoanResponse> timTaiKhoan(@PathVariable("idtaikhoan") String userId) {
        return ApiResponse.<TaikhoanResponse>builder()
                .code(200)
                .message("OK")
                .result(taiKhoanService.timTaiKhoan(userId))
                .build();
    }

    @PutMapping("/{idtaikhoan}")
    private ApiResponse<TaikhoanResponse> updateUser(@PathVariable("idtaikhoan") String idtaikhoan, @RequestBody TaiKhoanUpdateRequest request){
        return ApiResponse.<TaikhoanResponse>builder()
                .code(200)
                .message("OK")
                .result(taiKhoanService.updateTaiKhoan(idtaikhoan,request))
                .build();
    }
    @DeleteMapping("/{idtaikhoan}")
    private ApiResponse<String> xoaTK(@PathVariable("idtaikhoan") String idtaikhoan){
        taiKhoanService.xoaTaiKhoan(idtaikhoan);
        return ApiResponse.<String>builder()
                .result("Da xoa user")
                .build();
    }

    @GetMapping("/myinfo")
    private ApiResponse<TaikhoanResponse> thongTinTaiKhoan(){
        return ApiResponse.<TaikhoanResponse>builder()
                .result(taiKhoanService.getMyInfo())
                .build();
    }
}
