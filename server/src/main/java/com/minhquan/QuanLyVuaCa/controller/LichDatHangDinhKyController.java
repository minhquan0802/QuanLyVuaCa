package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.LichDatHangRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LichDatHangResponse;
import com.minhquan.QuanLyVuaCa.service.LichDatHangDinhKyService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/LichDatHang")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LichDatHangDinhKyController {

    LichDatHangDinhKyService lichDatHangDinhKyService;

    @GetMapping
    public ApiResponse<List<LichDatHangResponse>> danhSachCuaToi() {
        return ApiResponse.<List<LichDatHangResponse>>builder()
                .code(200)
                .message("OK")
                .result(lichDatHangDinhKyService.layDanhSachCuaToi())
                .build();
    }

    @PostMapping
    public ApiResponse<LichDatHangResponse> taoMoi(@Valid @RequestBody LichDatHangRequest request) {
        return ApiResponse.<LichDatHangResponse>builder()
                .code(200)
                .message("Đã tạo lịch đặt hàng định kỳ")
                .result(lichDatHangDinhKyService.taoMoi(request))
                .build();
    }

    @PutMapping("/{idlich}")
    public ApiResponse<LichDatHangResponse> capNhat(@PathVariable String idlich,
                                                    @Valid @RequestBody LichDatHangRequest request) {
        return ApiResponse.<LichDatHangResponse>builder()
                .code(200)
                .message("Đã cập nhật lịch đặt hàng")
                .result(lichDatHangDinhKyService.capNhat(idlich, request))
                .build();
    }

    @PutMapping("/{idlich}/trang-thai")
    public ApiResponse<LichDatHangResponse> doiTrangThai(@PathVariable String idlich,
                                                         @RequestParam boolean kichHoat) {
        return ApiResponse.<LichDatHangResponse>builder()
                .code(200)
                .message(kichHoat ? "Đã bật lịch đặt hàng" : "Đã tạm dừng lịch đặt hàng")
                .result(lichDatHangDinhKyService.doiTrangThai(idlich, kichHoat))
                .build();
    }

    @DeleteMapping("/{idlich}")
    public ApiResponse<String> xoa(@PathVariable String idlich) {
        lichDatHangDinhKyService.xoa(idlich);
        return ApiResponse.<String>builder()
                .code(200)
                .message("Đã xóa lịch đặt hàng")
                .build();
    }
}
