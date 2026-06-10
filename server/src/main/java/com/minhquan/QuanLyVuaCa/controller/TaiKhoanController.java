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



    @PostMapping("/resend-verification")
    public ApiResponse<String> guiLaiEmail(@RequestParam String email) {
        return ApiResponse.<String>builder()
                .code(200)
                .result(taiKhoanService.guiLaiEmailXacThuc(email))
                .build();
    }

    @GetMapping("/verify-email")
    public ApiResponse<String> verifyEmail(@RequestParam String token) {
        return ApiResponse.<String>builder()
                .code(200)
                .result(taiKhoanService.xacThucEmail(token))
                .build();
    }

    @GetMapping("/cho-duyet")
    public ApiResponse<List<TaikhoanResponse>> layDanhSachChoDuyet() {
        return ApiResponse.<List<TaikhoanResponse>>builder()
                .code(200)
                .result(taiKhoanService.layDanhSachChoDuyet())
                .build();
    }

    @PutMapping("/duyet/{id}")
    public ApiResponse<TaikhoanResponse> duyetTaiKhoan(@PathVariable String id) {
        return ApiResponse.<TaikhoanResponse>builder()
                .code(200)
                .message("Phê duyệt tài khoản thành công")
                .result(taiKhoanService.duyetTaiKhoan(id))
                .build();
    }

}
