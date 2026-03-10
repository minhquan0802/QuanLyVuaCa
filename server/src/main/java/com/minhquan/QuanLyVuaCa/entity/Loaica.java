package com.minhquan.QuanLyVuaCa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "loaica")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Loaica {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idloaica", nullable = false)
    private Integer id;

    @Size(max = 60)
    @Column(name = "tenloaica", length = 60)
    private String tenloaica;

    @Column(name = "mieuta")
    private String mieuta;

    @Column(name = "hinhanhurl")
    private String hinhanhurl;

}