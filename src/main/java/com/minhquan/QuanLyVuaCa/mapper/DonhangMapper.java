package com.minhquan.QuanLyVuaCa.mapper;


import com.minhquan.QuanLyVuaCa.dto.request.ChitietDonhangRequest;
import com.minhquan.QuanLyVuaCa.dto.request.DonhangRequestCreation;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietDonhangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.DonhangResponse;
import com.minhquan.QuanLyVuaCa.entity.Chitietdonhang;
import com.minhquan.QuanLyVuaCa.entity.Donhang;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface DonhangMapper {

    DonhangResponse toDonhangResponse(Donhang donhang, String tenKhachHang, String sdtKhachHang);

    @Mapping(target = "idchitietcaban", source = "idchitietcaban.id")
    @Mapping(target = "tenLoaiCa", source = "idchitietcaban.idloaica.tenloaica")
    @Mapping(target = "tenSize", source = "idchitietcaban.idsizeca.sizeca")
    @Mapping(target = "tongtiendukien", source = "tongtiendukien")
    ChitietDonhangResponse toChitietResponse(Chitietdonhang chitiet);

    // --- CHIỀU VÀO (Request -> Entity) ---

    // 1. Map đơn hàng (Bỏ qua các trường tự sinh hoặc set thủ công)
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