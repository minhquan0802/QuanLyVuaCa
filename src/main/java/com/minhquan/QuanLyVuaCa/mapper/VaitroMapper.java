package com.minhquan.QuanLyVuaCa.mapper;
import com.minhquan.QuanLyVuaCa.dto.request.LoaicaCeationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.LoaicaUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.LoaicaResponse;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.dto.response.VaitroResponse;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.entity.Vaitro;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface VaitroMapper {
//    Vaitro toVaitro (VaitroCeationRequest request);
    VaitroResponse toVaitroResponse(Vaitro vaitro);
//    void updateVaitro(@MappingTarget Vaitro vaitro, VaitroUpdateRequest request);
}
