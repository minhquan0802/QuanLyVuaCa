package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.ThongbaoRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.ThongbaoResponse;
import com.minhquan.QuanLyVuaCa.service.ThongBaoService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/ThongBao")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ThongBaoController {

    ThongBaoService thongBaoService;

    // Mở kết nối SSE để nhận thông báo real-time của user hiện tại
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        return thongBaoService.subscribe();
    }

    @GetMapping
    public ApiResponse<List<ThongbaoResponse>> layDanhSach() {
        return ApiResponse.<List<ThongbaoResponse>>builder()
                .code(200)
                .message("Lấy danh sách thông báo thành công")
                .result(thongBaoService.layDanhSach())
                .build();
    }

    @GetMapping("/chua-xem")
    public ApiResponse<Long> demChuaXem() {
        return ApiResponse.<Long>builder()
                .code(200)
                .result(thongBaoService.demChuaXem())
                .build();
    }

    @PutMapping("/{idthongbao}/da-xem")
    public ApiResponse<String> danhDauDaXem(@PathVariable String idthongbao) {
        thongBaoService.danhDauDaXem(idthongbao);
        return ApiResponse.<String>builder()
                .code(200)
                .message("Đã đánh dấu đã xem")
                .build();
    }

    @PutMapping("/da-xem-tat-ca")
    public ApiResponse<String> danhDauDaXemTatCa() {
        thongBaoService.danhDauDaXemTatCa();
        return ApiResponse.<String>builder()
                .code(200)
                .message("Đã đánh dấu tất cả đã xem")
                .build();
    }

    // Admin gửi thông báo thủ công tới 1 vai trò (cũng là caller đầu tiên của guiChoVaiTro,
    // trước khi scheduler lô-quá-hạn/công-nợ được code ở các buổi sau)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> guiThongBao(@RequestBody ThongbaoRequest request) {
        thongBaoService.guiChoVaiTro(request.getVaitro(), request.getNoidung(), request.getLoai(), request.getLink());
        return ApiResponse.<String>builder()
                .code(200)
                .message("Đã gửi thông báo")
                .build();
    }
}
