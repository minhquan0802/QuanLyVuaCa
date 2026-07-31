package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
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
public class MoLaiLoaiCaRequest {

    @Valid
    @NotEmpty(message = "CAUHINH_SIZE_EMPTY")
    @Builder.Default
    private List<CauHinhKichThuocVaGiaRequest> cauhinhkichthuoc = new ArrayList<>();
}
