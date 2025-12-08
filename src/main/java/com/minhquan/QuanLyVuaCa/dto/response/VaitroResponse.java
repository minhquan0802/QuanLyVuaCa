package com.minhquan.QuanLyVuaCa.dto.response;


import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Data
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VaitroResponse {
    Integer id;
    String tenvaitro;
}
