package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.Enum.TrangThaiTaiKhoan;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanUpdateRequest;
import com.minhquan.QuanLyVuaCa.entity.Taikhoan;
import com.minhquan.QuanLyVuaCa.entity.Vaitro;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import com.minhquan.QuanLyVuaCa.repository.VaitroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public List<Taikhoan> getTaiKhoans(){
        return taiKhoanRepository.findAll();
    }
    public Taikhoan timTaiKhoan(String id){
        return taiKhoanRepository.findById(id).orElseThrow(()-> new RuntimeException("Khong tim thay user"));
    }
    public Taikhoan updateTaiKhoan(String idTaiKhoan,TaiKhoanUpdateRequest request){
        Taikhoan taikhoan = timTaiKhoan(idTaiKhoan);
        taikhoan.setHo(request.getHo());
        taikhoan.setTen(request.getTen());
        taikhoan.setEmail(request.getEmail());
        taikhoan.setSodienthoai(request.getSodienthoai());
        taikhoan.setDiachi(request.getDiachi());
        taikhoan.setMatkhau(request.getMatkhau());

        return taiKhoanRepository.save(taikhoan);
    }
    public void xoaTaiKhoan(String id){
        taiKhoanRepository.deleteById(id);
    }
}
