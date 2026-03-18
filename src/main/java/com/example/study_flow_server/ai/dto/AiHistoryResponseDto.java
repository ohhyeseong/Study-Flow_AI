package com.example.study_flow_server.ai.dto;

import com.example.study_flow_server.ai.entity.AiHistory;
import com.example.study_flow_server.ai.entity.Quiz;

import java.time.LocalDateTime;
import java.util.Optional;

public record AiHistoryResponseDto(
        Long id,
        String userPrompt,
        String aiResponse,
        String imageUrl,
        LocalDateTime createdAt,
        AiQuizDto quizDto
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
