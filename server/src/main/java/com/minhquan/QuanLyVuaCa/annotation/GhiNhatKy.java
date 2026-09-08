package com.minhquan.QuanLyVuaCa.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Đánh dấu một method service cần ghi vào nhật ký thao tác.
 *
 * Chỉ gắn cho thao tác có ý nghĩa nghiệp vụ và tác động tới tiền/quyền — không gắn tràn lan,
 * mục đích là giữ nhật ký sạch và đọc được (đây cũng là lý do chọn AOP thay vì Hibernate Envers).
 *
 * Ví dụ:
 * <pre>
 * &#64;GhiNhatKy(bang = "donhang", hanhDong = "SUA_KHOI_LUONG_THUC_TE", thamSoId = 0)
 * public void capNhatThucTeDonHang(String idDonhang, List&lt;UpdateCanNangRequest&gt; ds) { ... }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface GhiNhatKy {

    /** Tên bảng chứa bản ghi bị tác động, ví dụ "donhang", "phieunhap", "banggia". */
    String bang();

    /** Tên hành động, ví dụ "SUA_KHOI_LUONG_THUC_TE", "DIEU_CHINH_CONG_NO". */
    String hanhDong();

    /**
     * Vị trí (0-based) của tham số chứa ID bản ghi bị tác động.
     * Để -1 nếu thao tác không gắn với một bản ghi cụ thể.
     */
    int thamSoId() default 0;

    /** Ghi chú cố định kèm theo mỗi bản ghi nhật ký. */
    String ghiChu() default "";
}
