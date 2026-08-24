package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.NhatKyThaoTacResponse;
import com.minhquan.QuanLyVuaCa.service.NhatKyThaoTacService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Chỉ có API đọc. Nhật ký thao tác cố tình không có endpoint sửa/xóa — kể cả ADMIN cũng không
 * được phép chỉnh sửa vết truy, nếu không thì audit log mất hết ý nghĩa.
 */
@RestController
@RequestMapping("/NhatKyThaoTac")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NhatKyThaoTacController {

    NhatKyThaoTacService nhatKyThaoTacService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Page<NhatKyThaoTacResponse>> timKiem(
            @RequestParam(required = false) String tenbang,
            @RequestParam(required = false) String hanhdong,
            @RequestParam(required = false) String idnguoithuchien,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tuNgay,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate denNgay,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Instant tu = tuNgay == null ? null : tuNgay.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant den = denNgay == null ? null : denNgay.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        return ApiResponse.<Page<NhatKyThaoTacResponse>>builder()
                .code(200)
                .message("Lấy nhật ký thao tác thành công")
                .result(nhatKyThaoTacService.timKiem(tenbang, hanhdong, idnguoithuchien, tu, den, page, size))
                .build();
    }

    // Dùng cho tab "Lịch sử thay đổi" trên màn chi tiết đơn hàng / phiếu nhập.
    @GetMapping("/{tenbang}/{idbanghi}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ApiResponse<List<NhatKyThaoTacResponse>> layTheoBanGhi(@PathVariable String tenbang,
                                                                  @PathVariable String idbanghi) {
        return ApiResponse.<List<NhatKyThaoTacResponse>>builder()
                .code(200)
                .message("Lấy lịch sử thay đổi thành công")
                .result(nhatKyThaoTacService.layTheoBanGhi(tenbang, idbanghi))
                .build();
    }

    @GetMapping("/bo-loc")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BoLocNhatKy> layBoLoc() {
        return ApiResponse.<BoLocNhatKy>builder()
                .code(200)
                .message("Lấy bộ lọc nhật ký thành công")
                .result(new BoLocNhatKy(
                        nhatKyThaoTacService.layDanhSachBang(),
                        nhatKyThaoTacService.layDanhSachHanhDong()))
                .build();
    }

    public record BoLocNhatKy(List<String> danhSachBang, List<String> danhSachHanhDong) {}
}
