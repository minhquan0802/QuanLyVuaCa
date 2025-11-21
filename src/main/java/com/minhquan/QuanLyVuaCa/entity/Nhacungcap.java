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
@Table(name = "nhacungcap")
public class Nhacungcap {
    @Id
    @Column(name = "idncc", nullable = false)
    private Integer id;

    @Size(max = 60)
    @Column(name = "tenncc", length = 60)
    private String tenncc;

    @Size(max = 15)
    @Column(name = "sodienthoai", length = 15)
    private String sodienthoai;

}