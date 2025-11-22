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
@Table(name = "vaitro")
//JsonIgnoreProperties là cách “làm sạch” dữ liệu JSON, giúp bạn chỉ nhận được các field thực sự của Entity.
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Vaitro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idvaitro", nullable = false)
    private Integer id;

    @Size(max = 50)
    @NotNull
    @Column(name = "tenvaitro", nullable = false, length = 50)
    private String tenvaitro;

    @Override
    public String toString() {
        return "Vaitro{" +
                "id=" + id +
                ", tenvaitro='" + tenvaitro + '\'' +
                '}';
    }
}