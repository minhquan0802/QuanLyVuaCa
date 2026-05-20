package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.enums.TrangThaiTaiKhoan;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.TaikhoanResponse;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.TaikhoanMapper;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class TaiKhoanService {
    TaiKhoanRepository taiKhoanRepository;
    TaikhoanMapper taikhoanMapper;
    PasswordEncoder passwordEncoder;

    public TaikhoanResponse taoTaiKhoan(TaiKhoanCreationRequest request){
        if(taiKhoanRepository.existsByEmail(request.getEmail()))
            throw new AppExceptions(ErrorCode.USER_EXISTED);

        Taikhoan taikhoan = taikhoanMapper.toTaikhoan(request);
        taikhoan.setTrangthaitk(TrangThaiTaiKhoan.HOAT_DONG);

        taikhoan.setMatkhau(passwordEncoder.encode(request.getMatkhau()));
        taiKhoanRepository.save(taikhoan);
        return taikhoanMapper.toTaikhoanResponse(taikhoan);
    }

    @PreAuthorize("hasAnyRole('admin', 'nhanvienkho', 'nhanvien', 'nhanvienbanhang')")
    public List<TaikhoanResponse> getTaiKhoans(){
        List<Taikhoan> taikhoans = taiKhoanRepository.findAll();
        List<TaikhoanResponse> responses = new ArrayList<>();
        for (Taikhoan tk : taikhoans) {
            responses.add(taikhoanMapper.toTaikhoanResponse(tk));
        }
        return responses;
    }

    @PostAuthorize("returnObject.email ==  authentication.name")
    public TaikhoanResponse timTaiKhoan(String id) {
        return taikhoanMapper.toTaikhoanResponse(
                taiKhoanRepository.findById(id).orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED)));
    }
    @PreAuthorize("hasAnyRole('admin', 'nhanvienkho', 'nhanvien', 'nhanvienbanhang', 'khachle', 'khachsi')")
    public TaikhoanResponse updateTaiKhoan(String idTaiKhoan,TaiKhoanUpdateRequest request){
        Taikhoan taikhoan = taiKhoanRepository.findById(idTaiKhoan).orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));
        taikhoanMapper.updateTaikhoan(taikhoan,request);



        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        if (request.getMatkhau() != null && !request.getMatkhau().isEmpty()) {
            taikhoan.setMatkhau(passwordEncoder.encode(request.getMatkhau()));
        }

        return taikhoanMapper.toTaikhoanResponse(taiKhoanRepository.save(taikhoan));
    }
    @PreAuthorize("hasRole('admin')")
    public void xoaTaiKhoan(String id){
        taiKhoanRepository.deleteById(id);
    }


    public TaikhoanResponse getMyInfo(){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        var context = SecurityContextHolder.getContext();
        String email = context.getAuthentication().getName();
        Taikhoan tk = taiKhoanRepository.findByEmail(email).orElseThrow(
                () -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));
        return taikhoanMapper.toTaikhoanResponse(tk);
    }
}
