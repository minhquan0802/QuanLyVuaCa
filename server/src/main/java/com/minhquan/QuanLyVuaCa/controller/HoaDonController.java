package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.service.HoaDonService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/hoadon")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class HoaDonController {

    HoaDonService hoaDonService;

    // vatRate: 0.05 hoặc 0.10
    @GetMapping("/{iddonhang}/pdf")
    @PreAuthorize("hasAnyRole('admin', 'nhanvienbanhang', 'nhanvien', 'khachle', 'khachsi')")
    public ResponseEntity<byte[]> xuatHoaDon(
            @PathVariable String iddonhang,
            @RequestParam(defaultValue = "0.10") float vatRate) {

        byte[] pdf = hoaDonService.xuatHoaDonPdf(iddonhang, vatRate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "HoaDon_" + iddonhang.substring(0, 8) + ".pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }
}
