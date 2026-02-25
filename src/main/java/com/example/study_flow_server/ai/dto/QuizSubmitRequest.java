package com.example.study_flow_server.ai.dto;

public record QuizSubmitRequest(
        Long quizId,
        String userAnswer
) {
}
