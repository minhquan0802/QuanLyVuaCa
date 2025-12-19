package com.minhquan.QuanLyVuaCa.mapper;

import com.minhquan.QuanLyVuaCa.dto.request.BanggiaRequest;
import com.minhquan.QuanLyVuaCa.dto.response.BanggiaResponse;
import com.minhquan.QuanLyVuaCa.entity.Banggia;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BanggiaMapper {

    @Mapping(source = "chitietcaban.id", target = "idChitietcaban")
    @Mapping(source = "chitietcaban.idloaica.tenloaica", target = "tenLoaiCa")
    @Mapping(source = "chitietcaban.idsizeca.sizeca", target = "tenSize")
    @Mapping(source = "ngaybatdau", target = "ngayBatDau") // Entity (chữ thường) -> DTO (CamelCase)
    @Mapping(source = "ngayketthuc", target = "ngayKetThuc")
    @Mapping(source = "chitietcaban.idloaica.id", target = "idLoaiCa")
    @Mapping(source = "giabanle", target = "giaBanLe")
    @Mapping(source = "giabansi", target = "giaBanSi")
    BanggiaResponse toResponse(Banggia entity);

    @Mapping(target = "chitietcaban", ignore = true)
    @Mapping(source = "giabanle", target = "giabanle")
    @Mapping(source = "giabansi", target = "giabansi")
    Banggia toEntity(BanggiaRequest request);
}