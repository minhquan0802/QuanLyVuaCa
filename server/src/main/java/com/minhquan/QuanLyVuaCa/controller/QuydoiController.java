package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.QuydoiRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.QuydoiResponse;
import com.minhquan.QuanLyVuaCa.service.QuydoiService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Quydois")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class QuydoiController {

    QuydoiService quydoiService;

    @GetMapping
    public ApiResponse<List<QuydoiResponse>> getAllQuydois() {
        return ApiResponse.<List<QuydoiResponse>>builder()
                .result(quydoiService.getAllQuydois())
                .build();
    }

    @PostMapping
    public ApiResponse<QuydoiResponse> create(@RequestBody QuydoiRequest request) {
        return ApiResponse.<QuydoiResponse>builder()
                .result(quydoiService.create(request))
                .build();
    }
}
