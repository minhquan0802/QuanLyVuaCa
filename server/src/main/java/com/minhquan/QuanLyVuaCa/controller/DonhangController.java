package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.DonhangRequestCreation;
import com.minhquan.QuanLyVuaCa.dto.request.DonhangStatusRequest;
import com.minhquan.QuanLyVuaCa.dto.request.UpdateCanNangRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.BaoCaoLechKhoResponse;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietDonhangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.DonhangResponse;
import com.minhquan.QuanLyVuaCa.service.DonhangService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Donhangs")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DonhangController {

    DonhangService donhangService;

    // API 1: Lấy danh sách đơn hàng (Có tên khách)
    @GetMapping
    public ApiResponse<List<DonhangResponse>> danhSachDonhangs() {
        return ApiResponse.<List<DonhangResponse>>builder()
                .code(200)
                .message("OK")
                .result(donhangService.getAllDonhangs())
                .build();
    }

    // API 1b: Lấy thông tin 1 đơn hàng theo ID
    @GetMapping("/{id}")
    public ApiResponse<DonhangResponse> layMotDonhang(@PathVariable String id) {
        return ApiResponse.<DonhangResponse>builder()
                .code(200)
                .message("OK")
                .result(donhangService.getDonhangById(id))
                .build();
    }

    // API 2: Lấy chi tiết 1 đơn hàng (Có tên cá, size) -> Frontend đang gọi cái này
    @GetMapping("/{id}/chitiet")
    public ApiResponse<List<ChitietDonhangResponse>> layChiTiet(@PathVariable String id) {
        return ApiResponse.<List<ChitietDonhangResponse>>builder()
                .code(200)
                .message("OK")
                .result(donhangService.getChiTietDonHang(id))
                .build();
    }

    // API 3: Cập nhật trạng thái (Dùng @RequestBody để hứng JSON)
    @PutMapping("/{id}/status")
    public ApiResponse<DonhangResponse> capNhatTrangThai(
            @PathVariable String id,
            @RequestBody DonhangStatusRequest request) { // Sửa từ @RequestParam thành @RequestBody

        return ApiResponse.<DonhangResponse>builder()
                .code(200)
                .message("Cập nhật thành công")
                .result(donhangService.updateStatus(id, request.getTrangthaidonhang()))
                .build();
    }

    @PostMapping
    public ApiResponse<DonhangResponse> taoDonHang(@RequestBody DonhangRequestCreation request) {
        return ApiResponse.<DonhangResponse>builder()
                .code(200)
                .message("Đặt hàng thành công")
                .result(donhangService.createDonhang(request))
                .build();
    }

    @GetMapping("/my-orders")
    public ApiResponse<List<DonhangResponse>> ThongTinDonhang() {
        return ApiResponse.<List<DonhangResponse>>builder()
                .result(donhangService.getMyOrders())
                .build();
    }
    @PutMapping("/{id}/xac-nhan-nhan-hang")
    public ApiResponse<DonhangResponse> xacNhanNhanHang(@PathVariable String id) {
        return ApiResponse.<DonhangResponse>builder()
                .code(200)
                .message("Xác nhận nhận hàng thành công")
                .result(donhangService.xacNhanNhanHang(id))
                .build();
    }

    @PutMapping("/{id}/huy")
    public ApiResponse<DonhangResponse> huyDonHang(@PathVariable String id) {
        return ApiResponse.<DonhangResponse>builder()
                .code(200)
                .message("Hủy đơn hàng thành công")
                .result(donhangService.huyDonHang(id))
                .build();
    }

    @PutMapping("/{id}/cap-nhat-can-nang")
    public ApiResponse<String> updateCanNang(@PathVariable String id, @RequestBody List<UpdateCanNangRequest> request) {
        donhangService.updateThucTeDonHang(id, request);
        return ApiResponse.<String>builder().result("Cập nhật cân nặng thành công").build();
    }

    // Chỉ đọc: xem trước kho tổng vs tổng lô còn hàng của từng sản phẩm đang lệch bao nhiêu,
    // theo hướng nào — gọi cái này TRƯỚC khi quyết định có chạy dong-bo-lai-ton-kho hay không.
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @GetMapping("/bao-cao-lech-kho")
    public ApiResponse<List<BaoCaoLechKhoResponse>> baoCaoLechKho() {
        return ApiResponse.<List<BaoCaoLechKhoResponse>>builder()
                .code(200)
                .message("OK")
                .result(donhangService.baoCaoLechKho())
                .build();
    }

    // Một lần: đối soát lại lô (Chitietphieunhap.soluongconlai) cho khớp với kho tổng
    // (Chitietcaban.soluongton) — dùng để sửa dữ liệu cũ đã lệch do bug đơn COD trước đây không trừ lô.
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @PostMapping("/dong-bo-lai-ton-kho")
    public ApiResponse<List<String>> dongBoLaiTonKhoTheoLo() {
        List<String> canhBao = donhangService.dongBoLaiTonKhoTheoLo();
        return ApiResponse.<List<String>>builder()
                .code(200)
                .message(canhBao.isEmpty() ? "Đã đối soát xong, không có cảnh báo" : "Đối soát xong, một số sản phẩm cần xem tay")
                .result(canhBao)
                .build();
    }
}