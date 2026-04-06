package com.example.study_flow_server.ai.dto;

import com.example.study_flow_server.ai.entity.AiHistory;
import com.example.study_flow_server.ai.entity.Quiz;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.Optional;

public record AiHistoryResponseDto(
        @JsonProperty("id") Long id,
        @JsonProperty("user_prompt") String userPrompt,
        @JsonProperty("ai_response") String aiResponse,
        @JsonProperty("image_url") String imageUrl,
        @JsonProperty("created_at") LocalDateTime createdAt,
        @JsonProperty("quiz_dto") AiQuizDto quizDto
) {
    public static AiHistoryResponseDto from(AiHistory aiHistory){
        AiQuizDto quizDto = Optional.ofNullable(aiHistory.getQuiz())
                .map(Quiz::toAiQuizDto)
                .orElse(null);

        return new AiHistoryResponseDto(
                aiHistory.getId(),
                aiHistory.getUserPrompt(),
                aiHistory.getAiResponse(),
                aiHistory.getImageUrl(),
                aiHistory.getCreatedAt(),
                quizDto
        );
    }
}
