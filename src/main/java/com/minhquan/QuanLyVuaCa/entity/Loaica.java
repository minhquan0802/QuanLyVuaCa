package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "loaica")
public class Loaica {
    @Id
    @Column(name = "idloaica", nullable = false)
    private Integer id;

    @Size(max = 60)
    @Column(name = "tenloaica", length = 60)
    private String tenloaica;

}