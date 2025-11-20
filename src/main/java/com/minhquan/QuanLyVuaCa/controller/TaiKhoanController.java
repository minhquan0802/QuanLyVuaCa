package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.Tam.TaiKhoan;
import com.minhquan.QuanLyVuaCa.service.TaiKhoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TaiKhoanController {
    @Autowired
    private TaiKhoanService taiKhoanService;

    @PostMapping("/TaiKhoans")
    TaiKhoan taoUser(@RequestBody TaiKhoanCreationRequest request){
        return taiKhoanService.taoTaiKhoan(request);
    }
}
