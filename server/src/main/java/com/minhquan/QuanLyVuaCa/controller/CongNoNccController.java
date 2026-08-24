package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.DieuChinhCongNoNccRequest;
import com.minhquan.QuanLyVuaCa.dto.request.ThanhToanNccRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.CongNoNccResponse;
import com.minhquan.QuanLyVuaCa.dto.response.CongNoPhieuNhapResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LichSuCongNoNccResponse;
import com.minhquan.QuanLyVuaCa.service.CongNoNccService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/CongNoNCC")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CongNoNccController {

    CongNoNccService congNoNccService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<CongNoNccResponse>> layDanhSach() {
        return ApiResponse.<List<CongNoNccResponse>>builder()
                .code(200)
                .message("Lấy danh sách công nợ nhà cung cấp thành công")
                .result(congNoNccService.layDanhSach())
                .build();
    }

    @GetMapping("/{idncc}/phieu-nhap")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<CongNoPhieuNhapResponse>> layPhieuNhap(@PathVariable Integer idncc) {
        return ApiResponse.<List<CongNoPhieuNhapResponse>>builder()
                .code(200)
                .message("Lấy danh sách phiếu nhập thành công")
                .result(congNoNccService.layPhieuNhapCuaNcc(idncc))
                .build();
    }

    @GetMapping("/{idncc}/lich-su")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<LichSuCongNoNccResponse>> layLichSu(@PathVariable Integer idncc) {
        return ApiResponse.<List<LichSuCongNoNccResponse>>builder()
                .code(200)
                .message("Lấy lịch sử công nợ nhà cung cấp thành công")
                .result(congNoNccService.layLichSu(idncc))
                .build();
    }

    @PostMapping("/{idncc}/thanh-toan")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> thanhToan(@PathVariable Integer idncc,
                                         @Valid @RequestBody ThanhToanNccRequest request) {
        congNoNccService.thanhToan(idncc, request);
        return ApiResponse.<String>builder()
                .code(200)
                .message("Đã ghi nhận thanh toán cho nhà cung cấp")
                .build();
    }

    @PutMapping("/{idncc}/dieu-chinh")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> dieuChinh(@PathVariable Integer idncc,
                                         @Valid @RequestBody DieuChinhCongNoNccRequest request) {
        congNoNccService.dieuChinhThuCong(idncc, request.getSotien(), request.isTang(), request.getGhichu());
        return ApiResponse.<String>builder()
                .code(200)
                .message("Đã điều chỉnh công nợ nhà cung cấp")
                .build();
    }
}
