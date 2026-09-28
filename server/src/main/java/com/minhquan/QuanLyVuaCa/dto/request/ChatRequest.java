package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatRequest {

    @NotBlank(message = "CHAT_MESSAGE_INVALID")
    @Size(max = 1000, message = "CHAT_MESSAGE_INVALID")
    String message;
}
