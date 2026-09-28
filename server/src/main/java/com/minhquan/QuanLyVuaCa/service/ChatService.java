package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.ChatRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ChatResponse;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.Map;

@Slf4j
@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatService {
    RestClient restClient;

    public ChatService(
            @Value("${ai-service.url}") String aiServiceUrl,
            @Value("${ai-service.connect-timeout-seconds:3}") long connectTimeoutSeconds,
            @Value("${ai-service.read-timeout-seconds:60}") long readTimeoutSeconds) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(connectTimeoutSeconds));
        // LLM có thể mất vài chục giây cho câu trả lời dài
        requestFactory.setReadTimeout(Duration.ofSeconds(readTimeoutSeconds));

        this.restClient = RestClient.builder()
                .baseUrl(aiServiceUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public ChatResponse hoiTroLy(ChatRequest request) {
        AiChatReply reply;
        try {
            reply = restClient.post()
                    .uri("/ai/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("message", request.getMessage().trim()))
                    .retrieve()
                    .body(AiChatReply.class);
        } catch (RestClientException e) {
            throw new AppExceptions(ErrorCode.AI_SERVICE_UNAVAILABLE,
                    ErrorCode.AI_SERVICE_UNAVAILABLE.getMessage(), e);
        }

        if (reply == null || !reply.success()) {
            log.warn("AI service trả lỗi: {}", reply == null ? "body rỗng" : reply.error());
            throw new AppExceptions(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
        return ChatResponse.builder()
                .reply(reply.reply())
                .build();
    }

    private record AiChatReply(boolean success, String reply, String error) {
    }
}
