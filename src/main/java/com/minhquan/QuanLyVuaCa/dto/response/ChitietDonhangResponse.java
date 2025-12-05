package com.minhquan.QuanLyVuaCa.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChitietDonhangResponse {
    private String idchitietdonhang;
    private String tenChiTietCaBan; // Tên hiển thị (Lấy từ entity Chitietcaban)
    private String tenDonViTinh;    // Tên hiển thị (Lấy từ entity Donvitinh)
    private Integer soluong;
    private BigDecimal tongtiendukien;
    private BigDecimal tongtienthucte;
}