package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.ChatRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import com.minhquan.QuanLyVuaCa.dto.response.ChatResponse;
import com.minhquan.QuanLyVuaCa.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;

    @PostMapping
    public ApiResponse<ChatResponse> hoiTroLy(@RequestBody @Valid ChatRequest request) {
        return ApiResponse.<ChatResponse>builder()
                .code(200)
                .message("OK")
                .result(chatService.hoiTroLy(request))
                .build();
    }
}
