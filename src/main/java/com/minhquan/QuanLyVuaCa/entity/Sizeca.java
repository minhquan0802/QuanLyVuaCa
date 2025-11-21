package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "sizeca")
public class Sizeca {
    @Id
    @Column(name = "idsizeca", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idloaica", nullable = false)
    private Loaica idloaica;

    @Size(max = 20)
    @Column(name = "sizeca", length = 20)
    private String sizeca;

}