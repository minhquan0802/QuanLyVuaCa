package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.entity.Nhacungcap;
import com.minhquan.QuanLyVuaCa.service.NhacungcapService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Nhacungcaps")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@CrossOrigin(origins = "http://localhost:3000")
public class NhacungcapController {

    NhacungcapService nhacungcapService;

    @GetMapping
    public ApiResponse<List<Nhacungcap>> getAll() {
        return ApiResponse.<List<Nhacungcap>>builder()
                .result(nhacungcapService.getAll())
                .build();
    }

    @PostMapping
    public ApiResponse<Nhacungcap> create(@RequestBody Nhacungcap ncc) {
        return ApiResponse.<Nhacungcap>builder()
                .result(nhacungcapService.create(ncc))
                .build();
    }
}