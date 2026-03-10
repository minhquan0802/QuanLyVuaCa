package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.LoaicaCeationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.LoaicaUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LoaicaResponse;
import com.minhquan.QuanLyVuaCa.dto.response.VaitroResponse;
import com.minhquan.QuanLyVuaCa.service.LoaicaService;
import com.minhquan.QuanLyVuaCa.service.VaitroService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/vaitro")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@CrossOrigin(origins = "http://localhost:3000")
public class VaitroController {
    private VaitroService service;


    @GetMapping
    ApiResponse<List<VaitroResponse>> danhSachVaiTros() {
        return ApiResponse.<List<VaitroResponse>>builder()
                .code(200)
                .message("OK")
                .result(service.getVaiTros())
                .build();
    }
}
