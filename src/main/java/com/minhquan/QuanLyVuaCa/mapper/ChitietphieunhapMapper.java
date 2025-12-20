package com.minhquan.QuanLyVuaCa.mapper;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietPhieunhapRequest;
import com.minhquan.QuanLyVuaCa.entity.Chitietphieunhap;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ChitietphieunhapMapper {

    // Ignore quan hệ để set trong service
    @Mapping(target = "idphieunhap", ignore = true)
    @Mapping(target = "idchitietcaban", ignore = true)
    @Mapping(target = "trangthaica", ignore = true)
    @Mapping(target = "ngaythanhly", ignore = true)
    @Mapping(target = "soluongton", ignore = true)
    Chitietphieunhap toEntity(ChitietPhieunhapRequest request);

}