package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.BanggiaRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.BanggiaResponse;
import com.minhquan.QuanLyVuaCa.service.BanggiaService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Banggias")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BanggiaController {

    BanggiaService banggiaService;

    @PostMapping
    public ApiResponse<BanggiaResponse> create(@RequestBody BanggiaRequest request) {
        return ApiResponse.<BanggiaResponse>builder()
                .result(banggiaService.create(request))
                .message("Thiết lập giá thành công")
                .build();
    }

    @GetMapping
    public ApiResponse<List<BanggiaResponse>> getAll() {
        return ApiResponse.<List<BanggiaResponse>>builder()
                .result(banggiaService.getAll())
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> delete(@PathVariable Integer id) {
        banggiaService.delete(id);
        return ApiResponse.<String>builder()
                .result("Đã xóa giá")
                .build();
    }
}