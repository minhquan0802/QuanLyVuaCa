package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.BienLoiNhuanResponse;
import com.minhquan.QuanLyVuaCa.dto.response.HaoHutCanResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LaiLoTongQuanResponse;
import com.minhquan.QuanLyVuaCa.service.BaoCaoService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/BaoCao")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BaoCaoController {

    BaoCaoService baoCaoService;

    @GetMapping("/lai-lo")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<LaiLoTongQuanResponse> laiLoTongQuan(
            @RequestParam(defaultValue = "THIS_MONTH") String range,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.<LaiLoTongQuanResponse>builder()
                .code(200)
                .message("Lấy báo cáo lãi/lỗ thành công")
                .result(baoCaoService.laiLoTongQuan(range, from, to))
                .build();
    }

    @GetMapping("/bien-loi-nhuan/san-pham")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<BienLoiNhuanResponse>> bienLoiNhuanTheoSanPham(
            @RequestParam(defaultValue = "THIS_MONTH") String range,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.<List<BienLoiNhuanResponse>>builder()
                .code(200)
                .message("Lấy biên lợi nhuận theo sản phẩm thành công")
                .result(baoCaoService.bienLoiNhuanTheoSanPham(range, from, to))
                .build();
    }

    @GetMapping("/bien-loi-nhuan/lo")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<BienLoiNhuanResponse>> bienLoiNhuanTheoLo(
            @RequestParam(defaultValue = "THIS_MONTH") String range,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.<List<BienLoiNhuanResponse>>builder()
                .code(200)
                .message("Lấy biên lợi nhuận theo lô thành công")
                .result(baoCaoService.bienLoiNhuanTheoLo(range, from, to))
                .build();
    }

    @GetMapping("/hao-hut-can")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<HaoHutCanResponse>> haoHutCan(
            @RequestParam(defaultValue = "THIS_MONTH") String range,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.<List<HaoHutCanResponse>>builder()
                .code(200)
                .message("Lấy báo cáo hao hụt cân thành công")
                .result(baoCaoService.haoHutCan(range, from, to))
                .build();
    }
}
