package com.minhquan.QuanLyVuaCa.mapper;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface TaikhoanMapper {
    Taikhoan toTaikhoan(TaiKhoanCreationRequest request);

    TaikhoanResponse toTaikhoanResponse(Taikhoan taikhoan);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateTaikhoan(@MappingTarget Taikhoan taikhoan, TaiKhoanUpdateRequest request);
}
