package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.PhieuthanhlyRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LoHangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.PhieuthanhlyResponse;
import com.minhquan.QuanLyVuaCa.service.PhieuthanhlyService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Phieuthanhlys")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PhieuthanhlyController {

    PhieuthanhlyService phieuthanhlyService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PhieuthanhlyResponse> taoPhieuThanhly(@RequestBody PhieuthanhlyRequest request) {
        return ApiResponse.<PhieuthanhlyResponse>builder()
                .code(200)
                .message("Tạo phiếu thanh lý thành công")
                .result(phieuthanhlyService.taoPhieuThanhly(request))
                .build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<PhieuthanhlyResponse>> layDanhSachPhieuThanhLy() {
        return ApiResponse.<List<PhieuthanhlyResponse>>builder()
                .code(200)
                .message("Lấy danh sách phiếu thanh lý thành công")
                .result(phieuthanhlyService.layDanhSachPhieuThanhLy())
                .build();
    }

    @GetMapping("/lo-con-hang")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<LoHangResponse>> layDanhSachLoConHang(@RequestParam Integer idchitietcaban) {
        return ApiResponse.<List<LoHangResponse>>builder()
                .code(200)
                .message("Lấy danh sách lô còn hàng thành công")
                .result(phieuthanhlyService.layDanhSachLoConHang(idchitietcaban))
                .build();
    }

    @GetMapping("/tat-ca-lo-con-hang")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<LoHangResponse>> layTatCaLoConHang() {
        return ApiResponse.<List<LoHangResponse>>builder()
                .code(200)
                .message("Lấy danh sách tất cả lô còn hàng thành công")
                .result(phieuthanhlyService.layTatCaLoConHang())
                .build();
    }

    @GetMapping("/lo-qua-han")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<LoHangResponse>> layDanhSachLoQuaHan() {
        return ApiResponse.<List<LoHangResponse>>builder()
                .code(200)
                .message("Lấy danh sách lô quá hạn thành công")
                .result(phieuthanhlyService.layDanhSachLoQuaHan())
                .build();
    }
}
