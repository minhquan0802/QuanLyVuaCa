package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.NhacungcapRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.NhacungcapResponse;
import com.minhquan.QuanLyVuaCa.service.NhacungcapService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Nhacungcaps")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NhacungcapController {

    NhacungcapService nhacungcapService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<NhacungcapResponse>> getAll() {
        return ApiResponse.<List<NhacungcapResponse>>builder()
                .result(nhacungcapService.getAll())
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<NhacungcapResponse> create(@RequestBody @Valid NhacungcapRequest request) {
        return ApiResponse.<NhacungcapResponse>builder()
                .result(nhacungcapService.create(request))
                .build();
    }
}
