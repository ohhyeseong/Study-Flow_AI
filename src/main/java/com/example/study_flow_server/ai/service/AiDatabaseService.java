package com.example.study_flow_server.ai.service;

import com.example.study_flow_server.ai.dto.AiQuizDto;
import com.example.study_flow_server.ai.dto.AiResponseDto;
import com.example.study_flow_server.ai.entity.AiHistory;
import com.example.study_flow_server.ai.entity.Quiz;
import com.example.study_flow_server.ai.repository.AiHistoryRepository;
import com.example.study_flow_server.ai.repository.QuizRepository;
import com.example.study_flow_server.user.domain.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiDatabaseService {

    private final AiHistoryRepository aiHistoryRepository;
    private final QuizRepository quizRepository;
    private final ObjectMapper objectMapper;

    @Transactional // 여기서 확실하게 새 트랜잭션을 시작합니다.
    public void saveAnalysisResult(User user, String prompt, AiResponseDto response) {
        String fullResponse = response.aiResponse();
        String description = fullResponse;
        String quizJson = "";

        if (fullResponse != null && fullResponse.contains("###QUIZ###")) {
            String[] parts = fullResponse.split("###QUIZ###");
            description = parts[0].trim();
            quizJson = parts.length > 1 ? parts[1].trim() : "";
        }

        AiHistory history = AiHistory.builder()
                .user(user)
                .userPrompt(prompt)
                .aiResponse(description)
                .imageUrl(response.filename())
                .build();

        AiHistory savedHistory = aiHistoryRepository.save(history);
        log.info(">>> AiHistory 저장 완료: {}", savedHistory.getId());

        if (!quizJson.isEmpty()) {
            try {
                AiQuizDto quizDto = objectMapper.readValue(quizJson, AiQuizDto.class);
                Quiz quiz = Quiz.builder()
                        .aiHistory(savedHistory)
                        .question(quizDto.question())
                        .options(quizDto.options())
                        .answer(quizDto.answer())
                        .build();
                quizRepository.save(quiz);
                log.info(">>> Quiz 저장 완료");
            } catch (Exception e) {
                log.error("!!! Quiz 저장 실패: {}", e.getMessage());
            }
        }
    }
}
