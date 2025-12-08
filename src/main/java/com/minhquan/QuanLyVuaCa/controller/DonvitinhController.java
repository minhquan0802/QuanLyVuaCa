package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.entity.Donvitinh;
import com.minhquan.QuanLyVuaCa.repository.DonvitinhRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/Donvitinhs")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DonvitinhController {
    DonvitinhRepository donvitinhRepository;

    @GetMapping
    public ApiResponse<List<Donvitinh>> getAll() {
        return ApiResponse.<List<Donvitinh>>builder()
                .result(donvitinhRepository.findAll())
                .build();
    }
}