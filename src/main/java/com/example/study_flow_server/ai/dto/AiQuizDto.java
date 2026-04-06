package com.example.study_flow_server.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;
import java.util.List;

public record AiQuizDto(
        @JsonProperty("quiz_id") Long quizId,
        @JsonProperty("question") String question,
        @JsonProperty("options") List<String> options,
        @JsonProperty("answer") String answer,
        @JsonProperty("explanation") String explanation
) implements Serializable {
    private static final long serialVersionUID = 1L;
}