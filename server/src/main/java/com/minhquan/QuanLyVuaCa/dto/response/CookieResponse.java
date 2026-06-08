package com.minhquan.QuanLyVuaCa.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationResponse {
    @JsonIgnore
    String token;

    @JsonIgnore
    String refreshToken;

    boolean authenticated;
}
