package com.example.study_flow_server.ai.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

@Slf4j
public record AiResponseDto(
        String filename,

        @JsonProperty("user_prompt")
        String userPrompt,

        String mode,

        @JsonProperty("extracted_text")
        String extractedText,

        String description,
        AiQuizDto quizDto, // 퀴즈가 없는 경우 null이 될 수 있음

        @JsonProperty("db_status")
        String dbStatus
) {
        // ObjectMapper 인스턴스를 static final로 선언하여 한 번만 생성되도록 한다.
        private static final ObjectMapper STATIC_OBJECT_MAPPER = new ObjectMapper();

        // 팩토리 메소드를 사용하여 AI 서버의 원본 응답 문자열을 파싱한다.
        @JsonCreator
        public static AiResponseDto fromAiServerResponse(
                String filename,
                @JsonProperty("user_prompt") String userPrompt,
                String mode,
                @JsonProperty("extracted_text") String extractedText,
                @JsonProperty("ai_response") String rawAiResponse, // AI 서버의 원본 응답 문자열
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
                                        // 퀴즈 파싱 실패 시, 퀴즈는 null로 두고 진행 (또는 예외 처리 정책에 따라 CustomException 던지기)
                                }
                        }
                }

                return new AiResponseDto(
                        filename,
                        userPrompt,
                        mode,
                        extractedText,
                        parsedDescription, // 파싱된 설명
                        parsedQuizDto,    // 파싱된 퀴즈 DTO
                        dbStatus
                );
        }

        // 퀴즈가 존재하는지 확인하는 헬퍼 메소드
        public boolean hasQuiz() {
                return quizDto != null;
        }

        // 퀴즈가 없는 경우를 대비하여 Optional로 반환하는 헬퍼 메소드
        public Optional<AiQuizDto> getQuiz() {
                return Optional.ofNullable(quizDto);
        }
}