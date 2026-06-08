package com.minhquan.QuanLyVuaCa.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.servlet.http.Cookie;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CookieResponse {
    Cookie token;
    Cookie refreshToken;
}
