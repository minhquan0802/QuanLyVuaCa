package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.DatLaiMatKhauRequest;
import com.minhquan.QuanLyVuaCa.dto.request.DoiMatKhauRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.service.AuthenticationService;
import com.minhquan.QuanLyVuaCa.service.TaiKhoanService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/tai-khoan")
public class TaiKhoanController {
    @Autowired
    private TaiKhoanService taiKhoanService;
    @Autowired
    private AuthenticationService authenticationService;

    @PostMapping
    private ApiResponse<TaikhoanResponse> taoTaiKhoan(@Valid @RequestBody TaiKhoanCreationRequest request) {
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
                .result(taiKhoanService.layDanhSachTaiKhoan())
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
    private ApiResponse<TaikhoanResponse> capNhatTaiKhoan(@PathVariable("idtaikhoan") String idtaikhoan, @RequestBody TaiKhoanUpdateRequest request) {
        return ApiResponse.<TaikhoanResponse>builder()
                .code(200)
                .message("Cập nhật tài khoản thành công")
                .result(taiKhoanService.capNhatTaiKhoan(idtaikhoan, request))
                .build();
    }

    @DeleteMapping("/{idtaikhoan}")
    private ApiResponse<String> xoaTaiKhoan(@PathVariable("idtaikhoan") String idtaikhoan) {
        taiKhoanService.xoaTaiKhoan(idtaikhoan);
        return ApiResponse.<String>builder()
                .message("Xóa tài khoản thành công")
                .build();
    }

    @PutMapping("/doi-mat-khau")
    public ApiResponse<String> doiMatKhau(@Valid @RequestBody DoiMatKhauRequest request,
                                         HttpServletResponse response) {
        String result = taiKhoanService.doiMatKhau(request.getMatkhauCu(), request.getMatkhauMoi());
        clearAuthenticationCookies(response);
        return ApiResponse.<String>builder()
                .code(200)
                .result(result)
                .build();
    }

    @GetMapping("/my-info")
    private ApiResponse<TaikhoanResponse> thongTinTaiKhoan() {
        return ApiResponse.<TaikhoanResponse>builder()
                .result(taiKhoanService.layThongTinCaNhan())
                .build();
    }



    @PostMapping("/quen-mat-khau")
    public ApiResponse<String> quenMatKhau(@RequestParam String email) {
        return ApiResponse.<String>builder()
                .code(200)
                .result(taiKhoanService.quenMatKhau(email))
                .build();
    }

    @PostMapping("/dat-lai-mat-khau")
    public ApiResponse<String> datLaiMatKhau(@Valid @RequestBody DatLaiMatKhauRequest request,
                                            HttpServletResponse response) {
        String result = taiKhoanService.datLaiMatKhau(request.getToken(), request.getMatkhauMoi());
        clearAuthenticationCookies(response);
        return ApiResponse.<String>builder()
                .code(200)
                .result(result)
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
    public ApiResponse<String> xacThucEmail(@RequestParam String token) {
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

    private void clearAuthenticationCookies(HttpServletResponse response) {
        var cookies = authenticationService.addCookie(null, 0, null, 0);
        response.addHeader(HttpHeaders.SET_COOKIE, cookies.getToken().toString());
        response.addHeader(HttpHeaders.SET_COOKIE, cookies.getRefreshToken().toString());
    }

}
