package com.minhquan.QuanLyVuaCa.mapper;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietPhieuthanhlyRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietPhieuthanhlyResponse;
import com.minhquan.QuanLyVuaCa.entity.Chitietphieuthanhly;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ChitietphieuthanhlyMapper {

    // Ignore quan hệ + trường tính toán để set trong Service
    @Mapping(target = "idphieuthanhly", ignore = true)
    @Mapping(target = "idchitietcaban", ignore = true)
    @Mapping(target = "thanhtien", ignore = true)
    Chitietphieuthanhly toEntity(ChitietPhieuthanhlyRequest request);

    @Mapping(source = "idchitietcaban.idloaica.tenloaica", target = "tenLoaiCa")
    @Mapping(source = "idchitietcaban.idsizeca.sizeca", target = "tenSize")
    ChitietPhieuthanhlyResponse toResponse(Chitietphieuthanhly entity);
}
