package com.example.study_flow_server.ai.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.io.Serializable;
import java.util.Optional;

@Slf4j
public record AiResponseDto(
        @JsonProperty("filename") String filename,
        @JsonProperty("user_prompt") String userPrompt,
        @JsonProperty("mode") String mode,
        @JsonProperty("extracted_text") String extractedText,
        @JsonProperty("description") String description,
        @JsonProperty("quiz_dto") AiQuizDto quizDto,
        @JsonProperty("db_status") String dbStatus,
        @JsonProperty("response_time") Double responseTime
) implements Serializable {

    private static final long serialVersionUID = 1L;
    private static final ObjectMapper STATIC_OBJECT_MAPPER = new ObjectMapper();

    @JsonCreator
    public static AiResponseDto fromAiServerResponse(
            String filename,
            @JsonProperty("user_prompt") String userPrompt,
            String mode,
            @JsonProperty("extracted_text") String extractedText,
            @JsonProperty("ai_response") String rawAiResponse,
            @JsonProperty("db_status") String dbStatus
    ) {
        String parsedDescription = rawAiResponse;
        AiQuizDto parsedQuizDto = null;

        if (rawAiResponse != null && rawAiResponse.contains("###QUIZ###")) {
            String[] parts = rawAiResponse.split("###QUIZ###");
            parsedDescription = parts[0].trim();
            String quizJson = parts.length > 1 ? parts[1].trim() : "";

            if (!quizJson.isEmpty()) {
                try {
                    parsedQuizDto = STATIC_OBJECT_MAPPER.readValue(quizJson, AiQuizDto.class);
                } catch (JsonProcessingException e) {
                    log.error("!!! AiResponseDto 파싱 중 Quiz JSON 변환 실패: {}", e.getMessage());
                }
            }
        }

        return new AiResponseDto(
                filename,
                userPrompt,
                mode,
                extractedText,
                parsedDescription,
                parsedQuizDto,
                dbStatus,
                0.0
        );
    }

    public AiResponseDto withResponseTime(Double time) {
        return new AiResponseDto(
                filename, userPrompt, mode, extractedText, description, quizDto, dbStatus, time
        );
    }

    public boolean hasQuiz() {
        return quizDto != null;
    }

    public Optional<AiQuizDto> getQuiz() {
        return Optional.ofNullable(quizDto);
    }
}