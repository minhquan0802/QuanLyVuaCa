package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "donvitinh")
public class Donvitinh {
    @Id
    @Column(name = "iddvt", nullable = false)
    private Integer id;

    @Size(max = 20)
    @Column(name = "tendvt", length = 20)
    private String tendvt;

    @Column(name = "hesokg", precision = 10, scale = 2)
    private BigDecimal hesokg;

    @Size(max = 50)
    @Column(name = "ghichu", length = 50)
    private String ghichu;

}