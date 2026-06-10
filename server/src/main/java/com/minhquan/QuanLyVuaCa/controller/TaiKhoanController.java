package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.service.TaiKhoanService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/tai-khoan")
public class TaiKhoanController {
    @Autowired
    private TaiKhoanService taiKhoanService;

    @PostMapping
    private ApiResponse<TaikhoanResponse> taoTaikhoan(@Valid @RequestBody TaiKhoanCreationRequest request) {
        return ApiResponse.<TaikhoanResponse>builder()
                .code(200)
                .message("Tạo tài khoản thành công")
                .result(taiKhoanService.taoTaiKhoan(request))
                .build();
    }

    @GetMapping
    private ApiResponse<List<TaikhoanResponse>> danhSachTaiKhoan() {
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
    private ApiResponse<TaikhoanResponse> updateUser(@PathVariable("idtaikhoan") String idtaikhoan, @RequestBody TaiKhoanUpdateRequest request) {
        return ApiResponse.<TaikhoanResponse>builder()
                .code(200)
                .message("Cập nhật tài khoản thành công")
                .result(taiKhoanService.updateTaiKhoan(idtaikhoan, request))
                .build();
    }

    @DeleteMapping("/{idtaikhoan}")
    private ApiResponse<String> xoaTK(@PathVariable("idtaikhoan") String idtaikhoan) {
        taiKhoanService.xoaTaiKhoan(idtaikhoan);
        return ApiResponse.<String>builder()
                .message("Xóa tài khoản thành công")
                .build();
    }

    @GetMapping("/my-info")
    private ApiResponse<TaikhoanResponse> thongTinTaiKhoan() {
        return ApiResponse.<TaikhoanResponse>builder()
                .result(taiKhoanService.getMyInfo())
                .build();
    }
}
