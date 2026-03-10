package com.minhquan.QuanLyVuaCa.mapper;

import com.minhquan.QuanLyVuaCa.dto.request.PhieunhapRequest;
import com.minhquan.QuanLyVuaCa.dto.response.PhieunhapResponse;
import com.minhquan.QuanLyVuaCa.entity.Phieunhap;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PhieunhapMapper {

    // Ignore các trường quan hệ để set thủ công trong Service
    @Mapping(target = "idncc", ignore = true)     // Tên biến trong Entity là idncc
    @Mapping(target = "idloaica", ignore = true)  // Tên biến trong Entity là idloaica
    @Mapping(target = "idnguoitaophieu", ignore = true)
    @Mapping(target = "tongsoluong", ignore = true)
    Phieunhap toEntity(PhieunhapRequest request);

    // Map Response: Chấm (.) qua tên biến object
    @Mapping(source = "idncc.tenncc", target = "tenNhaCungCap")
    @Mapping(source = "idloaica.tenloaica", target = "tenLoaiCa")
    PhieunhapResponse toResponse(Phieunhap entity);
}