package com.minhquan.QuanLyVuaCa.mapper;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.entity.Vaitro;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TaikhoanMapper {
    Taikhoan toTaikhoan(TaiKhoanCreationRequest request);

    default Vaitro map(Integer id) {
        if (id == null) return null;
        Vaitro v = new Vaitro();
        v.setId(id);
        return v;
    }
    default Integer map(Vaitro v) {
        return (v == null) ? null : v.getId();
    }

    TaikhoanResponse toTaikhoanResponse(Taikhoan taikhoan);
    void updateTaikhoan(@MappingTarget Taikhoan taikhoan, TaiKhoanUpdateRequest request);
}
