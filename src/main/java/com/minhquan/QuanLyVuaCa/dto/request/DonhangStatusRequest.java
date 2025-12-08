package com.minhquan.QuanLyVuaCa.dto.request;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiDonHang;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DonhangStatusRequest {
    TrangThaiDonHang trangthaidonhang;
}