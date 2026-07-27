package com.minhquan.QuanLyVuaCa.util;

import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Donvitinh;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;

import java.math.BigDecimal;

public final class QuyDoiKhoiLuongUtils {
    private QuyDoiKhoiLuongUtils() {
    }

    public static BigDecimal xacDinhHeSo(Donvitinh donvitinh, Chitietcaban sanpham) {
        if (donvitinh != null && donvitinh.getHesokg() != null
                && donvitinh.getHesokg().compareTo(BigDecimal.ZERO) > 0) {
            return donvitinh.getHesokg();
        }
        if (sanpham != null && sanpham.getSokgtuongung() != null
                && sanpham.getSokgtuongung().compareTo(BigDecimal.ZERO) > 0) {
            return sanpham.getSokgtuongung();
        }
        throw new AppExceptions(ErrorCode.QUYDOI_NOT_EXISTED);
    }
}
