package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "vaitro")
public class Vaitro {
    @Id
    @Column(name = "idvaitro", nullable = false)
    private Integer id;

    @Size(max = 50)
    @NotNull
    @Column(name = "tenvaitro", nullable = false, length = 50)
    private String tenvaitro;

}