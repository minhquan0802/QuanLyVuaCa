package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiTaiKhoan;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.entity.Vaitro;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.TaikhoanMapper;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.minhquan.QuanLyVuaCa.repository.VaitroRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class TaiKhoanService {

    TaiKhoanRepository taiKhoanRepository;
    VaitroRepository vaitroRepository;
    TaikhoanMapper mapper;

    public TaikhoanResponse taoTaiKhoan(TaiKhoanCreationRequest request){
        if(taiKhoanRepository.existsByEmail(request.getEmail()))
            throw new AppExceptions(ErrorCode.USER_EXISTED);

        Vaitro vaitro = vaitroRepository.findById(request.getIdvaitro())
                .orElseThrow(()->new RuntimeException("Khong tim thay vai tro co id: "+request.getIdvaitro()));
        Taikhoan taikhoan = mapper.toTaikhoan(request);
        taikhoan.setTrangthaitk(TrangThaiTaiKhoan.HOAT_DONG);
        Taikhoan saved = taiKhoanRepository.save(taikhoan);
        return mapper.toTaikhoanResponse(taikhoan);
    }

    public List<TaikhoanResponse> getTaiKhoans(){
        List<Taikhoan> taikhoans = taiKhoanRepository.findAll();
        List<TaikhoanResponse> responses = new ArrayList<>();
        for (Taikhoan tk : taikhoans) {
            responses.add(mapper.toTaikhoanResponse(tk));
        }
        return responses;
    }
    public TaikhoanResponse timTaiKhoan(String id) {
        return mapper.toTaikhoanResponse(
                taiKhoanRepository.findById(id).orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED)));
    }
    public TaikhoanResponse updateTaiKhoan(String idTaiKhoan,TaiKhoanUpdateRequest request){
        Taikhoan taikhoan = taiKhoanRepository.findById(idTaiKhoan).orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));
        mapper.updateTaikhoan(taikhoan,request);

        Taikhoan updatedTailhoan = taiKhoanRepository.save(taikhoan);
        return mapper.toTaikhoanResponse(updatedTailhoan);
    }
    public void xoaTaiKhoan(String id){
        taiKhoanRepository.deleteById(id);
    }
}
