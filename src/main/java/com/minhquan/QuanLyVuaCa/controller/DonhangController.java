package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.DonhangRequestCreation;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.DonhangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.entity.Donhang;
import com.minhquan.QuanLyVuaCa.service.DonhangService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Donhangs")
@CrossOrigin(origins = "http://localhost:3000")
public class DonhangController {

    @Autowired
    private DonhangService donhangService;

    @GetMapping
    public ResponseEntity<List<Donhang>> danhSachDonhangs() {
        return ResponseEntity.ok(donhangService.getAllDonhangs());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Donhang> capNhatTrangThai(@PathVariable String id, @RequestParam String status) {
        return ResponseEntity.ok(donhangService.updateStatus(id, status));
    }
}