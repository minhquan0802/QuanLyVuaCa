package com.minhquan.QuanLyVuaCa.controller;


import com.minhquan.QuanLyVuaCa.dto.request.DangnhapRequest;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.service.TaiKhoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthenticateController {
    @Autowired
    private TaiKhoanService taiKhoanService;

    @PostMapping("/login") // Đường dẫn API mới
    public ResponseEntity<?> login(@RequestBody DangnhapRequest request) {
        try {
            Taikhoan user = taiKhoanService.login(request);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
