package com.example.study_flow_server.ai.dto;

import com.example.study_flow_server.ai.entity.QuizResult;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;

public record WrongNoteResponse(
        @JsonProperty("quiz_id") Long quizId,
        @JsonProperty("question") String question,
        @JsonProperty("options") List<String> options,
        @JsonProperty("answer") String answer,
        @JsonProperty("user_wrong_answer") String userWrongAnswer,
        @JsonProperty("explanation") String explanation,
        @JsonProperty("description") String description,
        @JsonProperty("created_at") LocalDateTime createdAt) {
    public static WrongNoteResponse from(QuizResult result) {
        return new WrongNoteResponse(
                result.getQuiz().getId(),
                result.getQuiz().getQuestion(),
                result.getQuiz().getOptions(),
                result.getQuiz().getAnswer(),
                result.getUserAnswer(),
                result.getQuiz().getExplanation(),
                result.getQuiz().getAiHistory().getAiResponse(),
                result.getCreatedAt());
    }
}
