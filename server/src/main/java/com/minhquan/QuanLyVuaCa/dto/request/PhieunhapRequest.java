package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PhieunhapRequest {

    @NotNull(message = "LOAICA_NOT_EXISTED")
    Integer idloaica;

    @NotNull(message = "NHACUNGCAP_NOT_EXISTED")
    Integer idncc;

    LocalDate ngaynhap;
    String ghichu;
    String trangthaithanhtoan;

    @NotEmpty(message = "CHITIET_PHIEUNHAP_EMPTY")
    @Valid
    List<ChitietPhieunhapRequest> listChiTiet;
}
