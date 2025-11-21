package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiTaiKhoan;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.entity.Vaitro;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.minhquan.QuanLyVuaCa.repository.VaitroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaiKhoanService {

    private final TaiKhoanRepository taiKhoanRepository;
    private final VaitroRepository vaitroRepository;


    public Taikhoan taoTaiKhoan(TaiKhoanCreationRequest request){
        Vaitro vaitro = vaitroRepository.findById(request.getIdvaitro())
                .orElseThrow(()->new RuntimeException("Khong tim thay vai tro co id: "+request.getIdvaitro()));
        Taikhoan taikhoan = new Taikhoan();
        taikhoan.setIdvaitro(vaitro);
        taikhoan.setHo(request.getHo());
        taikhoan.setTen(request.getTen());
        taikhoan.setEmail(request.getEmail());
        taikhoan.setSodienthoai(request.getSodienthoai());
        taikhoan.setDiachi(request.getDiachi());
        taikhoan.setMatkhau(request.getMatkhau());
        taikhoan.setTrangthaitk(TrangThaiTaiKhoan.HOAT_DONG);

        return taiKhoanRepository.save(taikhoan);
    }
}