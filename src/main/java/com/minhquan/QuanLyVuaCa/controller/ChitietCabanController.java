package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietCabanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietCabanResponse;
import com.minhquan.QuanLyVuaCa.service.ChitietCabanService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Chitietcabans")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChitietCabanController {

    ChitietCabanService chitietCabanService;

    @GetMapping
    public ApiResponse<List<ChitietCabanResponse>> getAll() {
        return ApiResponse.<List<ChitietCabanResponse>>builder()
                .result(chitietCabanService.getAll())
                .build();
    }

    @PostMapping
    public ApiResponse<ChitietCabanResponse> create(@RequestBody @Validated ChitietCabanCreationRequest request) {
        return ApiResponse.<ChitietCabanResponse>builder()
                .result(chitietCabanService.create(request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> delete(@PathVariable Integer id) {
        chitietCabanService.delete(id);
        return ApiResponse.<String>builder()
                .result("Đã xóa sản phẩm khỏi danh sách kinh doanh")
                .build();
    }
}