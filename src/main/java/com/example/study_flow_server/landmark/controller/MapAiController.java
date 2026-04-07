package com.example.study_flow_server.landmark.controller;

import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.global.response.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class MapAiController {

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqUrl;

    @PostMapping("/recommend")
    public ApiResponse<Map<String, String>> getAiRecommend(@RequestBody Map<String, Object> request) {
        if (groqApiKey == null || groqApiKey.isEmpty() || groqApiKey.startsWith("${")) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }

        String userPrompt = (String) request.get("userQuery");
        String places = (String) request.get("places");

        if (userPrompt == null)
            userPrompt = "추천해주세요.";
        if (places == null)
            places = "주변 정보 없음";

        String systemRole = "너는 친절한 학원강사야. 질문에 친절하게 한국말로 존댓말로 설명해줘."
                + "주변 공부학원들: [" + places + "]";

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "llama-3.3-70b-versatile");
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemRole),
                Map.of("role", "user", "content", userPrompt)));
        body.put("temperature", 0.7);

        String aiAnswer;
        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(groqUrl, entity, Map.class);

            if (response.getBody() == null || !response.getBody().containsKey("choices")) {
                throw new RuntimeException("Groq API response is empty or invalid");
            }

            List<?> choices = (List<?>) response.getBody().get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new RuntimeException("Groq API choices are empty");
            }

            Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
            Map<?, ?> message = (Map<?, ?>) firstChoice.get("message");
            if (message == null || !message.containsKey("content")) {
                throw new RuntimeException("Groq API message content is missing");
            }

            aiAnswer = (String) message.get("content");

        } catch (HttpStatusCodeException e) {
            String errorMsg = String.format("Groq API Error [%s]: %s", e.getStatusCode(), e.getResponseBodyAsString());
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR, errorMsg);
        } catch (Exception e) {
            String errorMsg = "System Error: " + e.getMessage();
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR, errorMsg);
        }

        return ApiResponse.ok(Map.of("answer", aiAnswer));
    }
}
