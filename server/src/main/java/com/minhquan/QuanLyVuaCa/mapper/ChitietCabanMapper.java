package com.minhquan.QuanLyVuaCa.mapper;

import com.minhquan.QuanLyVuaCa.dto.request.ChitietCabanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietCabanResponse;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ChitietCabanMapper {

    @Mapping(source = "id", target = "id")
    @Mapping(source = "idloaica.tenloaica", target = "tenLoaiCa") // Lấy tên cá
    @Mapping(source = "idsizeca.sizeca", target = "tenSize")       // Lấy tên size
    @Mapping(source = "idloaica.id", target = "idLoaiCa")          // Lấy ID cá (Integer)
    @Mapping(source = "idsizeca.id", target = "idSizeCa")    // Lấy ID size (Integer)
        // -----------------------------

    ChitietCabanResponse toResponse(Chitietcaban entity);

    @Mapping(target = "idloaica", ignore = true)
    @Mapping(target = "idsizeca", ignore = true)
    Chitietcaban toEntity(ChitietCabanCreationRequest request);
}