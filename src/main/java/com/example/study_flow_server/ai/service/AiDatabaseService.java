package com.example.study_flow_server.ai.service;

import com.example.study_flow_server.ai.dto.AiQuizDto;
import com.example.study_flow_server.ai.dto.AiResponseDto;
import com.example.study_flow_server.ai.entity.AiHistory;
import com.example.study_flow_server.ai.entity.Quiz;
import com.example.study_flow_server.ai.repository.AiHistoryRepository;
import com.example.study_flow_server.ai.repository.QuizRepository;
import com.example.study_flow_server.user.domain.User;
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

    @Transactional
    public AiResponseDto saveAnalysisResult(User user, String prompt, AiResponseDto response) {
        AiHistory history = AiHistory.builder()
                .user(user)
                .userPrompt(prompt)
                .aiResponse(response.description())
                .imageUrl(response.filename())
                .build();

        AiHistory savedHistory = aiHistoryRepository.save(history);
        log.info(">>> AiHistory 저장 완료: {}", savedHistory.getId());

        if (response.hasQuiz()) {
            try {
                AiQuizDto originalQuizDto = response.quizDto();

                Quiz quiz = Quiz.builder()
                        .aiHistory(savedHistory)
                        .question(originalQuizDto.question())
                        .options(originalQuizDto.options())
                        .answer(originalQuizDto.answer())
                        .explanation(originalQuizDto.explanation())
                        .build();

                Quiz savedQuiz = quizRepository.save(quiz);
                log.info(">>> Quiz 저장 완료: ID {}", savedQuiz.getId());

                // 저장된 ID와 해설을 포함한 DTO 생성
                AiQuizDto updatedQuizDto = new AiQuizDto(
                        savedQuiz.getId(),
                        originalQuizDto.question(),
                        originalQuizDto.options(),
                        originalQuizDto.answer(),
                        originalQuizDto.explanation() // 해설 유지
                );

                return new AiResponseDto(
                        response.filename(),
                        response.userPrompt(),
                        response.mode(),
                        response.extractedText(),
                        response.description(),
                        updatedQuizDto,
                        response.dbStatus(),
                        response.responseTime());

            } catch (Exception e) {
                log.error("!!! Quiz 저장 실패: {}", e.getMessage());
                throw new RuntimeException("Quiz 저장에 실패했습니다.", e);
            }
        }

        return response;
    }
}