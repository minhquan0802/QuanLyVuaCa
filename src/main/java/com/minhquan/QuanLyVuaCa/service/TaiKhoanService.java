package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.TaiKhoanCreationRequest;
import com.minhquan.QuanLyVuaCa.entity.TaiKhoan;
import com.minhquan.QuanLyVuaCa.repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TaiKhoanService {
    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    public TaiKhoan taoTaiKhoan(TaiKhoanCreationRequest request){
        TaiKhoan tk = new TaiKhoan();
        tk.setIdVaiTro(request.getIdVaiTro());
        tk.setHo(request.getHo());
        tk.setTen(request.getTen());
        tk.setMatKhau(request.getMatKhau());
        tk.setEmail(request.getEmail());
        tk.setSoDienThoai(request.getSoDienThoai());
        tk.setDiaChi(request.getDiaChi());
        tk.setTrangThaiTk(request.getTrangThaiTk());

        return taiKhoanRepository.save(tk);
    }
}
