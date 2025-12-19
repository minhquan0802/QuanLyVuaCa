package com.minhquan.QuanLyVuaCa.mapper;

import com.minhquan.QuanLyVuaCa.dto.request.SizecaRequest;
import com.minhquan.QuanLyVuaCa.dto.response.SizecaResponse;
import com.minhquan.QuanLyVuaCa.entity.Sizeca;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SizecaMapper {
    Sizeca toSizeca(SizecaRequest request);

    @Mapping(source = "id", target = "idsizeca")
    SizecaResponse toSizecaResponse(Sizeca sizeca);
}