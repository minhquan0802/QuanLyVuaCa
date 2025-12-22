package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PhieunhapRequest {
    @NotNull(message = "Vui lòng chọn loại cá")
    private Integer idloaica;

    @NotNull(message = "Vui lòng chọn nhà cung cấp")
    private Integer idncc;

    private LocalDate ngaynhap;
    private String ghichu;
    private String trangthaithanhtoan;

    @NotNull(message = "Danh sách chi tiết không được trống")
    private List<ChitietPhieunhapRequest> listChiTiet;
}