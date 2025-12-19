package com.minhquan.QuanLyVuaCa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "chitietcaban",
        // Thêm ràng buộc Unique để khớp với DB
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"idloaica", "idsizeca"})
        })
public class Chitietcaban {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idchitietcaban", nullable = false)
    private Integer id;

    // --- MỚI THÊM: Liên kết trực tiếp với Loại cá ---
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idloaica", nullable = false)
    private Loaica idloaica;

    // Liên kết với Size cá (Size chung)
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idsizeca", nullable = false)
    private Sizeca idsizeca;

    @Column(name = "soluongton", precision = 10, scale = 2)
    private BigDecimal soluongton;
}