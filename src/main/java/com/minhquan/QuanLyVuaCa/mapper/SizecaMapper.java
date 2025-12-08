package com.minhquan.QuanLyVuaCa.mapper;

import com.minhquan.QuanLyVuaCa.dto.request.SizecaRequest;
import com.minhquan.QuanLyVuaCa.dto.response.SizecaResponse;
import com.minhquan.QuanLyVuaCa.entity.Sizeca;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SizecaMapper {

    // 1. Chuyển từ Request (DTO) -> Entity
    // MapStruct không thể tự tìm Loaica từ ID được (việc đó của Service/Repository)
    // Nên ta bảo nó: "Bỏ qua trường idloaica đi, tao sẽ set thủ công ở Service"
    @Mapping(target = "idloaica", ignore = true)
    Sizeca toSizeca(SizecaRequest request);

    // --- FIX TẠI ĐÂY ---
    @Mapping(source = "id", target = "idsizeca") // Map từ Entity.id -> Response.idsizeca
    @Mapping(source = "idloaica.id", target = "idloaica")
    @Mapping(source = "idloaica.tenloaica", target = "tenloaica")
    SizecaResponse toSizecaResponse(Sizeca sizeca);
}