package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.DeXuatNhapHangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LuanChuyenHangHoaResponse;
import com.minhquan.QuanLyVuaCa.dto.response.ThongKeTongQuanResponse;
import com.minhquan.QuanLyVuaCa.service.ThongKeService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

// Cung cấp số liệu cho trang Dashboard admin (AdminDashboard.jsx)
@RestController
@RequestMapping("/Thongke")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ThongKeController {

    ThongKeService thongKeService;

    // 4 thẻ KPI: tổng doanh thu, chi phí nhập hàng, chi phí phát sinh, đơn hoàn thành
    @GetMapping("/tong-quan")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<ThongKeTongQuanResponse> layTongQuan(
            @RequestParam(defaultValue = "THIS_MONTH") String range,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.<ThongKeTongQuanResponse>builder()
                .code(200)
                .message("Lấy số liệu tổng quan thành công")
                .result(thongKeService.tinhTongQuan(range, from, to))
                .build();
    }

    // Bảng/biểu đồ nhập - bán - hao hụt theo từng loại cá
    @GetMapping("/luan-chuyen-hang-hoa")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<LuanChuyenHangHoaResponse>> layLuanChuyenHangHoa(
            @RequestParam(defaultValue = "THIS_MONTH") String range,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.<List<LuanChuyenHangHoaResponse>>builder()
                .code(200)
                .message("Lấy dữ liệu luân chuyển hàng hóa thành công")
                .result(thongKeService.tinhLuanChuyenHangHoa(range, from, to))
                .build();
    }

    // Danh sách loại cá bán chạy nhưng tồn kho thấp, cần nhập thêm
    @GetMapping("/de-xuat-nhap-hang")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<DeXuatNhapHangResponse>> layDeXuatNhapHang() {
        return ApiResponse.<List<DeXuatNhapHangResponse>>builder()
                .code(200)
                .message("Lấy đề xuất nhập hàng thành công")
                .result(thongKeService.tinhDeXuatNhapHang())
                .build();
    }
}
