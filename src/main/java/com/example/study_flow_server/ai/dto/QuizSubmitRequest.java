package com.example.study_flow_server.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record QuizSubmitRequest(
        @NotNull(message = "퀴즈 ID는 필수입니다.")
        @JsonProperty("quiz_id")
        Long quizId,
        @NotBlank(message = "사용자 답변은 필수입니다.")
        @JsonProperty("user_answer")
        String userAnswer
) {
}