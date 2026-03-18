package com.example.study_flow_server.landmark.controller;

import com.example.study_flow_server.global.exception.CustomException;
import com.example.study_flow_server.global.exception.ErrorCode;
import com.example.study_flow_server.global.response.ApiResponse;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class MapAiController {

    private final String GROQ_API_KEY = "api";
    private final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    @PostMapping("/recommend")
    public ApiResponse<Map<String, String>> getAiRecommend(@RequestBody Map<String, Object> request) {
        String userPrompt = (String) request.get("userQuery");
        String places = (String) request.get("places");

        String systemRole = "너는 친절한 학원강사야. 질문에 대하여 친절하게 대답해줘. "
                + "주변 장소들: [" + places + "]";

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(GROQ_API_KEY);

        Map<String, Object> body = Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", List.of(
                        Map.of("role", "system", "content", systemRole),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "temperature", 0.7
        );

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_URL, entity, Map.class);

            List choices = (List) response.getBody().get("choices");
            Map firstChoice = (Map) choices.get(0);
            Map message = (Map) firstChoice.get("message");
            String aiAnswer = (String) message.get("content");

            return ApiResponse.ok(Map.of("answer", aiAnswer));

        } catch (Exception e) {
            e.printStackTrace();
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}
