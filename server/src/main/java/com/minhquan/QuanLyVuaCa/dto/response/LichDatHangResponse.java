package com.minhquan.QuanLyVuaCa.dto.response;

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
public class LichDatHangResponse {
    String idlich;
    String tenlich;
    Set<Integer> cacNgayTrongTuan;
    LocalDate ngaybatdau;
    LocalDate ngayketthuc;
    boolean dangkichhoat;
    LocalDate lanchaycuoi;
    String loilanchaycuoi;
    LocalDate ngayChayKeTiep;
    String ghichu;
    List<ChiTietLichDatHangResponse> chiTiet;
}
