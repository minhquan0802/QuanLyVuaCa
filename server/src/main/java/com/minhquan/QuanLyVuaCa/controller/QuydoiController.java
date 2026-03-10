package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.entity.Quydoi;
import com.minhquan.QuanLyVuaCa.service.QuydoiService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Quydois")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class QuydoiController {

    QuydoiService quydoiService;

    @GetMapping
    public ApiResponse<List<Quydoi>> getAllQuydois() {
        return ApiResponse.<List<Quydoi>>builder()
                .result(quydoiService.getAllQuydois())
                .build();
    }
}