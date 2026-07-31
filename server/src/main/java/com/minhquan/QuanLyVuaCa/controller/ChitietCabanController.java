package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietCabanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.CapNhatSoKgTuongUngRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietCabanResponse;
import com.minhquan.QuanLyVuaCa.service.ChitietCabanService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
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
    public ApiResponse<List<ChitietCabanResponse>> layTatCa() {
        return ApiResponse.<List<ChitietCabanResponse>>builder()
                .result(chitietCabanService.layTatCa())
                .build();
    }

    @GetMapping("/loai-ca/{idLoaiCa}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<ChitietCabanResponse>> layTheoLoaiCa(
            @PathVariable Integer idLoaiCa) {
        return ApiResponse.<List<ChitietCabanResponse>>builder()
                .result(chitietCabanService.layTheoLoaiCa(idLoaiCa))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ChitietCabanResponse> taoMoi(@RequestBody @Validated ChitietCabanCreationRequest request) {
        return ApiResponse.<ChitietCabanResponse>builder()
                .result(chitietCabanService.taoMoi(request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> xoa(@PathVariable Integer id) {
        chitietCabanService.xoa(id);
        return ApiResponse.<String>builder()
                .result("Đã xóa sản phẩm khỏi danh sách kinh doanh")
                .build();
    }

    @PutMapping("/{id}/so-kg-tuong-ung")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ChitietCabanResponse> capNhatSoKgTuongUng(
            @PathVariable Integer id,
            @RequestBody @Validated CapNhatSoKgTuongUngRequest request) {
        return ApiResponse.<ChitietCabanResponse>builder()
                .result(chitietCabanService.capNhatSoKgTuongUng(id, request))
                .build();
    }
}
