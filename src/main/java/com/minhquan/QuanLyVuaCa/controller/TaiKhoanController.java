package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanUpdateRequest;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.minhquan.QuanLyVuaCa.service.TaiKhoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class TaiKhoanController {
    @Autowired
    private TaiKhoanService taiKhoanService;
    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @PostMapping("/TaiKhoans")
    Taikhoan taoUser(@RequestBody TaiKhoanCreationRequest request){
        Taikhoan newTaikhoan = taiKhoanService.taoTaiKhoan(request);
        return ResponseEntity.ok(newTaikhoan).getBody();
    }

    @GetMapping("/TaiKhoans")
    List<Taikhoan> danhSachUser(){
        return taiKhoanService.getTaiKhoans();
    }
    @GetMapping("/TaiKhoans/{idtaikhoan}")
    Taikhoan timUser(@PathVariable("idtaikhoan") String idtaikhoan){
        return taiKhoanService.timTaiKhoan(idtaikhoan);
    }
    @PutMapping("/TaiKhoans/{idtaikhoan}")
    Taikhoan updateTK(@PathVariable("idtaikhoan") String idtaikhoan, @RequestBody TaiKhoanUpdateRequest request){
        return taiKhoanService.updateTaiKhoan(idtaikhoan, request);
    }
    @DeleteMapping("/TaiKhoans/{idtaikhoan}")
    String xoaTK(@PathVariable("idtaikhoan") String idtaikhoan){
        taiKhoanService.xoaTaiKhoan(idtaikhoan);
        return "Da xoa tai khoan";
    }
}
