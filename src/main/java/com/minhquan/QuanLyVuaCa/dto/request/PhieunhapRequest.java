package com.minhquan.QuanLyVuaCa.dto.request;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhieunhapRequest {
    private Integer idloaica;
    private Integer idncc;
    private LocalDate ngaynhap;
    private String ghichu;
    private String trangthaithanhtoan;

    private List<ChitietPhieunhapRequest> listChiTiet;
}