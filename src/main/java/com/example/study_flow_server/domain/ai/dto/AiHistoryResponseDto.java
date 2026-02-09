package com.example.study_flow_server.domain.ai.dto;

import com.example.study_flow_server.domain.ai.entity.AiHistory;

import java.time.LocalDateTime;

public record AiHistoryResponseDto(
        Long id,
        String userPrompt,
        String aiResponse,
        String imageUrl,
        LocalDateTime createdAt
) {
    public static AiHistoryResponseDto from(AiHistory aiHistory){
        return new AiHistoryResponseDto(
                aiHistory.getId(),
                aiHistory.getUserPrompt(),
                aiHistory.getAiResponse(),
                aiHistory.getImageUrl(),
                aiHistory.getCreatedAt()
        );
    }
}
