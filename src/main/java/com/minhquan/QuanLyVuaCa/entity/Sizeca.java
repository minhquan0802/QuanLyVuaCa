package com.minhquan.QuanLyVuaCa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "sizeca")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Sizeca {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idsizeca", nullable = false)
    private Integer id;

    @Size(max = 20)
    @Column(name = "sizeca", length = 20)
    private String sizeca;

}