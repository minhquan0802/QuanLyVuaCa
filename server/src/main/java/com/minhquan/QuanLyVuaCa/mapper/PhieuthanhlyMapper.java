package com.minhquan.QuanLyVuaCa.mapper;

import com.minhquan.QuanLyVuaCa.dto.request.PhieuthanhlyRequest;
import com.minhquan.QuanLyVuaCa.entity.Phieuthanhly;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PhieuthanhlyMapper {

    // Ignore các trường set thủ công trong Service (người tạo, ngày, trạng thái enum)
    @Mapping(target = "idnguoitaophieu", ignore = true)
    @Mapping(target = "ngaythanhly", ignore = true)
    @Mapping(target = "trangthai", ignore = true)
    Phieuthanhly toEntity(PhieuthanhlyRequest request);
}
