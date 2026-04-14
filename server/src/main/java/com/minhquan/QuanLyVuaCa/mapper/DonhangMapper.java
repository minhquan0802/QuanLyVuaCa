package com.minhquan.QuanLyVuaCa.mapper;


import com.minhquan.QuanLyVuaCa.dto.request.ChitietDonhangRequest;
import com.minhquan.QuanLyVuaCa.dto.request.DonhangRequestCreation;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietDonhangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.DonhangResponse;
import com.minhquan.QuanLyVuaCa.entity.Chitietdonhang;
import com.minhquan.QuanLyVuaCa.entity.Donhang;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Mapper(componentModel = "spring")
public interface DonhangMapper {

    DonhangResponse toDonhangResponse(Donhang donhang, String tenKhachHang, String sdtKhachHang);

    @Mapping(target = "dongia", expression = "java(calculateUnitPrice(entity))")
    @Mapping(source = "idchitietcaban.id", target = "idchitietcaban")
    @Mapping(source = "idchitietcaban.idloaica.tenloaica", target = "tenLoaiCa")
    @Mapping(source = "idchitietcaban.idsizeca.sizeca", target = "tenSize")
    @Mapping(source = "iddonvitinh.id", target = "iddonvitinh")
    @Mapping(source = "khoiluongthucte", target = "soluongkgthucte") // Map Kg thực tế
    @Mapping(source = "khoiluongdukien", target = "soluongkgthuctequydoi") // Map Kg dự kiến
    ChitietDonhangResponse toChitietResponse(Chitietdonhang entity);
    // Hàm phụ trợ để tính toán (viết ngay trong interface Mapper nếu dùng Java 8+)
    default BigDecimal calculateUnitPrice(Chitietdonhang entity) {
        if (entity.getTongtiendukien() != null
                && entity.getSoluong() != null
                && entity.getSoluong() > 0) {

            return entity.getTongtiendukien().divide(
                    BigDecimal.valueOf(entity.getSoluong()),
                    2,
                    RoundingMode.HALF_UP
            );
        }
        return BigDecimal.ZERO;
    }

    @Mapping(target = "iddonhang", ignore = true)
    @Mapping(target = "trangthaidonhang", ignore = true) // Set thủ công ở Service
    @Mapping(target = "ngaydat", ignore = true)          // Set thủ công ở Service
    Donhang toDonhang(DonhangRequestCreation request);

    // 2. Map chi tiết đơn hàng (Chỉ map các trường số lượng/tiền, bỏ qua quan hệ ID)
    @Mapping(target = "idchitietcaban", ignore = true) // Set thủ công sau khi tìm DB
    @Mapping(target = "iddonvitinh", ignore = true)    // Set thủ công sau khi tìm DB
    @Mapping(target = "iddonhang", ignore = true)      // Set sau khi lưu đơn hàng cha
    Chitietdonhang toChitietEntity(ChitietDonhangRequest request);
}