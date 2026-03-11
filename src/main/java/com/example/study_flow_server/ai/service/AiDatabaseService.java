package com.example.study_flow_server.ai.service;

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
    public void saveAnalysisResult(User user, String prompt, AiResponseDto response) {
        // 파싱 로직을 모두 제거하고, DTO의 필드를 직접 사용한다.
        AiHistory history = AiHistory.builder()
                .user(user)
                .userPrompt(prompt)
                .aiResponse(response.description()) // 파싱된 설명 사용
                .imageUrl(response.filename())
                .build();

        AiHistory savedHistory = aiHistoryRepository.save(history);
        log.info(">>> AiHistory 저장 완료: {}", savedHistory.getId());

        // DTO의 헬퍼 메소드를 사용하여 퀴즈 존재 여부를 확인하고 저장한다.
        response.getQuiz().ifPresent(quizDto -> {
            try {
                Quiz quiz = Quiz.builder()
                        .aiHistory(history) // 먼저 메모리상에서 관계를 설정
                        .question(quizDto.question())
                        .options(quizDto.options())
                        .answer(quizDto.answer())
                        .build();
                quizRepository.save(quiz);
                log.info(">>> Quiz 저장 완료");
            } catch (Exception e) {
                // Quiz 저장 실패 시, 로그를 남기고 예외를 던져 트랜잭션을 롤백시킨다.
                log.error("!!! Quiz 저장 실패: {}", e.getMessage());
                throw new RuntimeException("Quiz 저장에 실패했습니다.", e);
            }
        });
    }
}

