package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LichDatHangRequest {

    @Size(max = 100, message = "LICH_DINH_KY_TEN_INVALID")
    String tenlich;

    // Thứ trong tuần theo chuẩn ISO: 1 = thứ Hai … 7 = Chủ nhật.
    @NotEmpty(message = "LICH_DINH_KY_THIEU_NGAY")
    Set<Integer> cacNgayTrongTuan;

    LocalDate ngaybatdau;
    LocalDate ngayketthuc;

    Boolean dangkichhoat;

    @Size(max = 255, message = "LICH_DINH_KY_GHICHU_INVALID")
    String ghichu;

    @Valid
    @NotEmpty(message = "LICH_DINH_KY_THIEU_SAN_PHAM")
    List<ChiTietLichDatHangRequest> chiTiet;
}
