package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.CapNhatHanMucRequest;
import com.minhquan.QuanLyVuaCa.dto.request.DieuChinhCongNoRequest;
import com.minhquan.QuanLyVuaCa.dto.request.MoKhoaRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.CongNoKhachResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LichSuCongNoResponse;
import com.minhquan.QuanLyVuaCa.service.CongNoService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/CongNo")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CongNoController {

    CongNoService congNoService;

    @PostMapping("/{idtaikhoan}/khoi-tao")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> khoiTaoCongNo(@PathVariable String idtaikhoan) {
        congNoService.khoiTaoCongNo(idtaikhoan);
        return ApiResponse.<String>builder()
                .code(200)
                .message("Đã khởi tạo công nợ từ lịch sử đơn hàng")
                .build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<CongNoKhachResponse>> layDanhSachKhachCoCongNo() {
        return ApiResponse.<List<CongNoKhachResponse>>builder()
                .code(200)
                .message("Lấy danh sách khách công nợ thành công")
                .result(congNoService.layDanhSachKhachCoCongNo())
                .build();
    }

    @PutMapping("/{idtaikhoan}/han-muc")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> capNhatHanMuc(@PathVariable String idtaikhoan, @Valid @RequestBody CapNhatHanMucRequest request) {
        congNoService.capNhatHanMuc(idtaikhoan, request.getHanmuctindung());
        return ApiResponse.<String>builder()
                .code(200)
                .message("Đã cập nhật hạn mức tín dụng")
                .build();
    }

    @PutMapping("/{idtaikhoan}/dieu-chinh")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> dieuChinhThuCong(@PathVariable String idtaikhoan, @Valid @RequestBody DieuChinhCongNoRequest request) {
        congNoService.dieuChinhThuCong(idtaikhoan, request.getSotien(), request.isTang(), request.getGhichu());
        return ApiResponse.<String>builder()
                .code(200)
                .message("Đã điều chỉnh công nợ")
                .build();
    }

    @PutMapping("/{idtaikhoan}/mo-khoa")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> moKhoaThuCong(@PathVariable String idtaikhoan, @Valid @RequestBody MoKhoaRequest request) {
        congNoService.moKhoaThuCong(idtaikhoan, request.getGhichu());
        return ApiResponse.<String>builder()
                .code(200)
                .message("Đã mở khóa đặt hàng")
                .build();
    }

    @GetMapping("/{idtaikhoan}/lich-su")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<LichSuCongNoResponse>> layLichSu(@PathVariable String idtaikhoan) {
        return ApiResponse.<List<LichSuCongNoResponse>>builder()
                .code(200)
                .message("Lấy lịch sử công nợ thành công")
                .result(congNoService.layLichSu(idtaikhoan))
                .build();
    }
}
