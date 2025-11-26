package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.service.LoaicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class LoaicaController {
    @Autowired
    private LoaicaService loaicaService;


    @GetMapping("/Loaicas")
    List<Loaica> danhSachLoaiCa(){
        return loaicaService.getLoaiCa();
    }
    @GetMapping("/Loaicas/{loaicaid}")
    Loaica timCa(@PathVariable("loaicaid") Integer loaicaid){
        return loaicaService.timLoaica(loaicaid);
    }

}
