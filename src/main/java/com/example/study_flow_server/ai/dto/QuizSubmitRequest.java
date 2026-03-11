package com.example.study_flow_server.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record QuizSubmitRequest(
        @NotNull(message = "퀴즈 ID는 필수입니다.")
        Long quizId,
        @NotBlank(message = "사용자 답변은 필수입니다.")
        String userAnswer
) {
}