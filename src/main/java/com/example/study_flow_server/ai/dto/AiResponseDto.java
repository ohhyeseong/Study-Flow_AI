package com.example.study_flow_server.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AiResponseDto(
        String filename,

        @JsonProperty("user_prompt")
        String userPrompt,

        String mode,

        @JsonProperty("extracted_text")
        String extractedText,

        @JsonProperty("ai_response")
        String  aiResponse,

        @JsonProperty("db_status")
        String dbStatus
) {
}
