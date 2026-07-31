package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaoLoaiCaHoanChinhRequest {

    @NotBlank(message = "LOAICA_NAME_INVALID")
    @Size(max = 60, message = "LOAICA_NAME_INVALID")
    String tenloaica;

    @Size(max = 2000, message = "LOAICA_DESCRIPTION_INVALID")
    String mieuta;

    @Valid
    @Builder.Default
    List<CauHinhKichThuocVaGiaRequest> cauhinhkichthuoc = new ArrayList<>();
}
