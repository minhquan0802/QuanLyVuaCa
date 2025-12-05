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

        Vaitro vaitro = vaitroRepository.findById(request.getIdvaitro())
                .orElseThrow(()->new RuntimeException("Khong tim thay vai tro co id: "+request.getIdvaitro()));
        Taikhoan taikhoan = mapper.toTaikhoan(request);
        taikhoan.setTrangthaitk(TrangThaiTaiKhoan.HOAT_DONG);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        taikhoan.setMatkhau(passwordEncoder.encode(request.getMatkhau()));
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
        System.out.println(taikhoan.getMatkhau());
        mapper.updateTaikhoan(taikhoan,request);

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        taikhoan.setMatkhau(passwordEncoder.encode(request.getMatkhau()));

        Taikhoan updatedTailhoan = taiKhoanRepository.save(taikhoan);
        return mapper.toTaikhoanResponse(updatedTailhoan);
    }
    public void xoaTaiKhoan(String id){
        taiKhoanRepository.deleteById(id);
    }


    public Taikhoan login(DangnhapRequest request) {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        // 1. Tìm user theo email
        Taikhoan user = taiKhoanRepository.findByEmail(request.getEmail());
        // 2. So khớp mật khẩu: (Mật khẩu chưa mã hóa, Mật khẩu đã mã hóa trong DB)
        boolean authenticated = passwordEncoder.matches(request.getMatkhau(), user.getMatkhau());

        if (!authenticated) {
            throw new RuntimeException("Mật khẩu không chính xác");
        }

        // 3. Trả về user nếu đúng (hoặc trả về Token JWT nếu bạn có làm JWT)
        return user;
    }
}
