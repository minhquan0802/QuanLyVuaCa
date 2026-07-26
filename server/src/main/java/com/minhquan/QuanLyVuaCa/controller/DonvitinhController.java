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
    public ApiResponse<List<DonvitinhResponse>> getAll() {
        return ApiResponse.<List<DonvitinhResponse>>builder()
                .code(200)
                .message("OK")
                .result(donvitinhService.getAll())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<DonvitinhResponse> getById(@PathVariable Integer id) {
        return ApiResponse.<DonvitinhResponse>builder()
                .code(200)
                .message("OK")
                .result(donvitinhService.getById(id))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DonvitinhResponse> create(@Valid @RequestBody DonvitinhRequest request) {
        return ApiResponse.<DonvitinhResponse>builder()
                .code(200)
                .message("Thêm đơn vị tính thành công")
                .result(donvitinhService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DonvitinhResponse> update(
            @PathVariable Integer id,
            @Valid @RequestBody DonvitinhRequest request) {
        return ApiResponse.<DonvitinhResponse>builder()
                .code(200)
                .message("Cập nhật đơn vị tính thành công")
                .result(donvitinhService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> delete(@PathVariable Integer id) {
        donvitinhService.delete(id);
        return ApiResponse.<String>builder()
                .code(200)
                .message("Xóa đơn vị tính thành công")
                .result("Deleted")
                .build();
    }
}
