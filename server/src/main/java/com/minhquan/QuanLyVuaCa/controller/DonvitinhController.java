package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.DonvitinhRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.DonvitinhResponse;
import com.minhquan.QuanLyVuaCa.service.DonvitinhService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Donvitinhs")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class DonvitinhController {
    private final DonvitinhService donvitinhService;

    @GetMapping
    public ApiResponse<List<DonvitinhResponse>> layTatCa() {
        return ApiResponse.<List<DonvitinhResponse>>builder()
                .code(200)
                .message("OK")
                .result(donvitinhService.layTatCa())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<DonvitinhResponse> layTheoId(@PathVariable Integer id) {
        return ApiResponse.<DonvitinhResponse>builder()
                .code(200)
                .message("OK")
                .result(donvitinhService.layTheoId(id))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DonvitinhResponse> taoMoi(@Valid @RequestBody DonvitinhRequest request) {
        return ApiResponse.<DonvitinhResponse>builder()
                .code(200)
                .message("Thêm đơn vị tính thành công")
                .result(donvitinhService.taoMoi(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DonvitinhResponse> capNhat(
            @PathVariable Integer id,
            @Valid @RequestBody DonvitinhRequest request) {
        return ApiResponse.<DonvitinhResponse>builder()
                .code(200)
                .message("Cập nhật đơn vị tính thành công")
                .result(donvitinhService.capNhat(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> xoa(@PathVariable Integer id) {
        donvitinhService.xoa(id);
        return ApiResponse.<String>builder()
                .code(200)
                .message("Xóa đơn vị tính thành công")
                .result("Deleted")
                .build();
    }
}
