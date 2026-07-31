package com.minhquan.QuanLyVuaCa.mapper;

import com.minhquan.QuanLyVuaCa.dto.request.LoaicaUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.LoaicaResponse;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface LoaicaMapper {
    LoaicaResponse toLoaicaResponse(Loaica loaica);
    void updateLoaica(@MappingTarget Loaica loaica, LoaicaUpdateRequest request);
}
