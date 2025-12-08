package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiTaiKhoan;
import com.minhquan.QuanLyVuaCa.dto.request.DangnhapRequest;
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
import org.springframework.beans.factory.annotation.Autowired;
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
    VaitroRepository vaitroRepository;
    TaikhoanMapper mapper;

    public TaikhoanResponse taoTaiKhoan(TaiKhoanCreationRequest request){
        if(taiKhoanRepository.existsByEmail(request.getEmail()))
            throw new AppExceptions(ErrorCode.USER_EXISTED);

        Taikhoan taikhoan = mapper.toTaikhoan(request);

        int roleId = 3;

        if (request.getIdvaitro() != null && !request.getIdvaitro().isEmpty()) {
            try {
                roleId = Integer.parseInt(request.getIdvaitro());
            } catch (NumberFormatException e) {
                throw new RuntimeException("ID Vai trò không hợp lệ");
            }
        }

        Vaitro vaitro = vaitroRepository.findById(roleId)
                .orElseThrow(() -> new AppExceptions(ErrorCode.IDVAITRO_EMPTY));
        taikhoan.setIdvaitro(vaitro);

        if(request.getTrangthaitk() != null) {
            try {
                taikhoan.setTrangthaitk(TrangThaiTaiKhoan.valueOf(request.getTrangthaitk()));
            } catch (IllegalArgumentException e) {
                taikhoan.setTrangthaitk(TrangThaiTaiKhoan.HOAT_DONG);
            }
        } else {
            taikhoan.setTrangthaitk(TrangThaiTaiKhoan.HOAT_DONG);
        }


        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        taikhoan.setMatkhau(passwordEncoder.encode(request.getMatkhau()));
        taiKhoanRepository.save(taikhoan);
        return mapper.toTaikhoanResponse(taikhoan);
    }

    @PreAuthorize("hasAnyRole('admin', 'nhanvienkho', 'nhanvien', 'nhanvienbanhang')")
    public List<TaikhoanResponse> getTaiKhoans(){
        List<Taikhoan> taikhoans = taiKhoanRepository.findAll();
        List<TaikhoanResponse> responses = new ArrayList<>();
        for (Taikhoan tk : taikhoans) {
            responses.add(mapper.toTaikhoanResponse(tk));
        }
        return responses;
    }

    @PostAuthorize("returnObject.email ==  authentication.name")
    public TaikhoanResponse timTaiKhoan(String id) {
        return mapper.toTaikhoanResponse(
                taiKhoanRepository.findById(id).orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED)));
    }
    @PreAuthorize("hasAnyRole('admin', 'nhanvienkho', 'nhanvien', 'nhanvienbanhang', 'khachle', 'khachsi')")
    public TaikhoanResponse updateTaiKhoan(String idTaiKhoan,TaiKhoanUpdateRequest request){
        Taikhoan taikhoan = taiKhoanRepository.findById(idTaiKhoan).orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));
        mapper.updateTaikhoan(taikhoan,request);



        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        if (request.getMatkhau() != null && !request.getMatkhau().isEmpty()) {
            taikhoan.setMatkhau(passwordEncoder.encode(request.getMatkhau()));
        }

        return mapper.toTaikhoanResponse(taiKhoanRepository.save(taikhoan));
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
        return mapper.toTaikhoanResponse(tk);
    }
}
