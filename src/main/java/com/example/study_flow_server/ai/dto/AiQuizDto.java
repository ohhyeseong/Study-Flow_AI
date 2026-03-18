package com.example.study_flow_server.ai.dto;

import java.util.List;

public record AiQuizDto(
        Long quizId,
        String question,
        List<String> options,
        String answer
) {
}
