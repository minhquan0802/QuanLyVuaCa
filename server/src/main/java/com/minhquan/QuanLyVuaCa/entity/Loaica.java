package com.minhquan.QuanLyVuaCa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "sanpham")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Loaica {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idloaica", nullable = false)
    private Integer id;

    @Size(max = 60)
    @Column(name = "tenloaica", length = 60)
    private String tenloaica;

    // Cột trong DB là TEXT. Không khai columnDefinition thì Hibernate mặc định varchar(255) và,
    // với ddl-auto=update, mỗi lần khởi động lại cố "alter table sanpham modify column mieuta
    // varchar(255)" — MySQL từ chối vì có mô tả dài hơn 255, để lại một ERROR trong log khởi động
    // che mất những lỗi DDL thật.
    @Column(name = "mieuta", columnDefinition = "TEXT")
    private String mieuta;

    @Column(name = "hinhanhurl")
    private String hinhanhurl;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;
}