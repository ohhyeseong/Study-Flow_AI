package com.example.study_flow_server.ai.dto;

import com.example.study_flow_server.ai.entity.QuizResult;

import java.time.LocalDateTime;
import java.util.List;

public record WrongNoteResponse(
        Long quizId,
        String question,
        List<String> options,
        String correctAnswer,
        String userWrongAnswer,
        LocalDateTime createdAt
) {
    public static WrongNoteResponse from (QuizResult result) {
        return new WrongNoteResponse(
                result.getQuiz().getId(),
                result.getQuiz().getQuestion(),
                result.getQuiz().getOptions(),
                result.getQuiz().getAnswer(),
                result.getUserAnswer(),
                result.getCreatedAt()
        );
    }
}
